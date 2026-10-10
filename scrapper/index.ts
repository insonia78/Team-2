import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import {
  type DevpostApiResponse,
  type DevpostHackathon,
  type ScrapedHackathon,
} from './models/hackathon';
import { getHackathonsCollection, type StoredHackathon } from './mongodb';

const DEVPOST_API_URL = 'https://devpost.com/api/hackathons';
const DEFAULT_PORT = 3000;

const app = express();
const port = Number(process.env.PORT) || DEFAULT_PORT;

app.use(express.json());

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, '').trim();

const normalizeThumbnailUrl = (url: string): string => {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return url;
};

const buildDevpostUrl = (request: Request): string => {
  const url = new URL(DEVPOST_API_URL);

  for (const [key, value] of Object.entries(request.query)) {
    if (key === 'persist') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === 'string') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

const shouldPersist = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(shouldPersist);
  }

  if (typeof value !== 'string') {
    return false;
  }

  return ['1', 'true', 'yes'].includes(value.toLowerCase());
};

const mapHackathon = (hackathon: DevpostHackathon): ScrapedHackathon => ({
  id: hackathon.id,
  title: hackathon.title,
  organization: hackathon.organization_name,
  location: hackathon.displayed_location?.location ?? 'Unknown',
  status: hackathon.open_state,
  url: hackathon.url,
  thumbnailUrl: normalizeThumbnailUrl(hackathon.thumbnail_url),
  submissionPeriod: hackathon.submission_period_dates,
  timeLeft: hackathon.time_left_to_submission,
  prizeAmount: stripHtml(hackathon.prize_amount),
  prizeCounts: hackathon.prizes_counts,
  registrationsCount: hackathon.registrations_count,
  themes: hackathon.themes?.map((theme) => theme.name) ?? [],
  featured: hackathon.featured,
  winnersAnnounced: hackathon.winners_announced,
  submissionGalleryUrl: hackathon.submission_gallery_url,
  startSubmissionUrl: hackathon.start_a_submission_url,
  inviteOnly: hackathon.invite_only,
  managedByDevpost: hackathon.managed_by_devpost_badge,
});

const persistHackathons = async (
  hackathons: ScrapedHackathon[],
  sourceUrl: string,
  fetchedAt: string,
): Promise<void> => {
  const collection = await getHackathonsCollection();

  for (const hackathon of hackathons) {
    const storedHackathon: StoredHackathon = {
      ...hackathon,
      fetchedAt,
      sourceUrl,
      updatedAt: new Date().toISOString(),
    };

    await collection.updateOne(
      { id: hackathon.id },
      {
        $set: storedHackathon,
      },
      {
        upsert: true,
      },
    );
  }
};

const fetchHackathons = async (request: Request, response: Response): Promise<void> => {
  const sourceUrl = buildDevpostUrl(request);

  try {
    const upstreamResponse = await fetch(sourceUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'devpost-scraper/1.0',
      },
    });

    if (!upstreamResponse.ok) {
      response.status(502).json({
        error: 'Failed to fetch hackathons from Devpost.',
        sourceUrl,
        statusCode: upstreamResponse.status,
      });
      return;
    }

    const payload = (await upstreamResponse.json()) as DevpostApiResponse;
    const fetchedAt = new Date().toISOString();
    const hackathons = payload.hackathons.map(mapHackathon);
    const persistToMongoDb = shouldPersist(request.query.persist);

    if (persistToMongoDb) {
      try {
        await persistHackathons(hackathons, sourceUrl, fetchedAt);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        response.status(500).json({
          error: 'Hackathons were scraped but could not be persisted to MongoDB.',
          sourceUrl,
          message,
        });
        return;
      }
    }

    response.json({
      sourceUrl,
      fetchedAt,
      total: payload.hackathons.length,
      persisted: persistToMongoDb,
      hackathons,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    response.status(500).json({
      error: 'Unexpected error while scraping Devpost.',
      sourceUrl,
      message,
    });
  }
};

const readCachedHackathons = async (_request: Request, response: Response): Promise<void> => {
  try {
    const hackathons = await getHackathonsCollection()
      .then((collection) => collection.find({}, { projection: { _id: 0 } }).toArray())
      .then((documents) => documents.sort((left, right) => left.title.localeCompare(right.title)));

    response.json({
      fetchedAt: new Date().toISOString(),
      total: hackathons.length,
      hackathons,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    response.status(500).json({
      error: 'Failed to read cached hackathons from MongoDB.',
      message,
    });
  }
};

app.get('/', (_request, response) => {
  response.json({
    message: 'Devpost hackathon scraper is running.',
    endpoints: {
      scrape: '/hackathons',
      scrapeAndPersist: '/hackathons?persist=true&page=1',
      cache: '/hackathons/cache',
    },
  });
});

app.get('/hackathons', fetchHackathons);
app.get('/hackathons/cache', readCachedHackathons);

app.listen(port, () => {
  console.log(`Scraper is running at http://localhost:${port}`);
});
