import { MongoClient, type Collection } from 'mongodb';
import type { ScrapedHackathon } from './models/hackathon';

export type StoredHackathon = ScrapedHackathon & {
  fetchedAt: string;
  sourceUrl: string;
  updatedAt: string;
};

const DATABASE_NAME = 'hackathon-opportunity-research';
const HACKATHONS_COLLECTION = 'hackathons';

let client: MongoClient | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (client) {
    return client;
  }

  const connectionString = process.env.MONGODB_CONNECTION_STRING?.trim();

  if (!connectionString) {
    throw new Error(
      'MongoDB is not configured. Set MONGODB_CONNECTION_STRING in the scrapper .env file.',
    );
  }

  client = new MongoClient(connectionString);
  await client.connect();

  return client;
};

export const getHackathonsCollection = async (): Promise<Collection<StoredHackathon>> => {
  const mongoClient = await getMongoClient();

  return mongoClient
    .db(DATABASE_NAME)
    .collection<StoredHackathon>(HACKATHONS_COLLECTION);
};
