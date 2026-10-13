import { and, asc, eq, gte, inArray, isNotNull, lte, ne } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { db } from "../db/client.js";
import { hackathonToApi, toHackathonInsert, toHackathonUpdate } from "../db/mappers.js";
import { hackathons } from "../db/schema.js";
import { findDuplicateByWebsite } from "../lib/dedupe.js";
import { isUniqueViolation } from "../lib/pg-errors.js";
import { assertVerificationRules } from "../lib/verification.js";
import {
  hackathonCreateSchema,
  hackathonListQuerySchema,
  hackathonUpdateSchema,
} from "../schemas/hackathon.js";

const deadlineQuerySchema = z.object({
  withinDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const hackathonRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/hackathons", async (request, reply) => {
    const query = hackathonListQuerySchema.parse(request.query);
    const conditions = [];

    if (query.status) conditions.push(eq(hackathons.status, query.status));
    if (query.confidence) conditions.push(eq(hackathons.confidence, query.confidence));
    if (query.format) conditions.push(eq(hackathons.format, query.format));
    if (query.shortlisted !== undefined) conditions.push(eq(hackathons.isShortlisted, query.shortlisted));

    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(hackathons.registrationDeadline))
        .limit(query.limit);

      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to list hackathons." });
    }
  });

  app.get("/api/hackathons/views/apply-now", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Verified - Apply Now"))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load Apply Now view." });
    }
  });

  app.get("/api/hackathons/views/prepare-before-opening", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Verified - Registration Upcoming"))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load Prepare Before Opening view." });
    }
  });

  app.get("/api/hackathons/views/monitor", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Monitor"))
        .orderBy(asc(hackathons.eventStart));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load monitor view." });
    }
  });

  app.get("/api/hackathons/views/shortlist", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.isShortlisted, true))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load shortlist view." });
    }
  });

  app.get("/api/hackathons/views/virtual-hybrid", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(inArray(hackathons.format, ["virtual", "hybrid"]))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load virtual/hybrid view." });
    }
  });

  app.get("/api/hackathons/views/travel-supported", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(
          and(
            isNotNull(hackathons.travelSupport),
            ne(hackathons.travelSupport, ""),
            ne(hackathons.travelSupport, "not confirmed"),
            ne(hackathons.travelSupport, "not provided"),
          ),
        )
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch {
      return reply.code(500).send({ error: "Failed to load travel-supported view." });
    }
  });

  app.get("/api/hackathons/views/deadlines", async (request, reply) => {
    const { withinDays } = deadlineQuerySchema.parse(request.query);
    const now = new Date();
    const upper = new Date(now);
    upper.setDate(upper.getDate() + withinDays);

    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(
          and(
            gte(hackathons.registrationDeadline, now),
            lte(hackathons.registrationDeadline, upper),
          ),
        )
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length, withinDays };
    } catch {
      return reply.code(500).send({ error: "Failed to load deadline view." });
    }
  });

  app.get("/api/hackathons/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const rows = await db.select().from(hackathons).where(eq(hackathons.id, id)).limit(1);
      const row = rows[0];
      if (!row) {
        return reply.code(404).send({ error: "Hackathon not found." });
      }
      return { data: hackathonToApi(row) };
    } catch {
      return reply.code(500).send({ error: "Failed to fetch hackathon." });
    }
  });

  app.post("/api/hackathons", async (request, reply) => {
    const payload = hackathonCreateSchema.parse(request.body);

    try {
      assertVerificationRules(payload);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : "Invalid verification data." });
    }

    try {
      const existingRows = await db
        .select({
          id: hackathons.id,
          event_name: hackathons.eventName,
          official_website: hackathons.officialWebsite,
        })
        .from(hackathons);

      const existing = findDuplicateByWebsite(existingRows, payload.official_website);
      if (existing) {
        return reply.code(409).send({
          error: "Duplicate official_website.",
          existing_id: existing.id,
          existing_event_name: existing.event_name,
        });
      }

      const [row] = await db.insert(hackathons).values(toHackathonInsert(payload)).returning();
      return reply.code(201).send({ data: hackathonToApi(row!) });
    } catch (error) {
      request.log.error(error);
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: "Duplicate official_website." });
      }
      return reply.code(500).send({ error: "Failed to create hackathon." });
    }
  });

  app.patch("/api/hackathons/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = hackathonUpdateSchema.parse(request.body);

    try {
      const rows = await db.select().from(hackathons).where(eq(hackathons.id, id)).limit(1);
      const current = rows[0];
      if (!current) {
        return reply.code(404).send({ error: "Hackathon not found." });
      }

      const apiRow = hackathonToApi(current);
      const merged = { ...apiRow, ...patch };

      try {
        assertVerificationRules({
          status: merged.status as typeof patch.status,
          confidence: merged.confidence as typeof patch.confidence,
          evidence_links: merged.evidence_links ?? [],
          researcher_name: merged.researcher_name ?? undefined,
          verifier_name: merged.verifier_name ?? undefined,
        });
      } catch (err) {
        return reply.code(400).send({ error: err instanceof Error ? err.message : "Invalid verification data." });
      }

      if (patch.official_website) {
        const others = await db
          .select({
            id: hackathons.id,
            official_website: hackathons.officialWebsite,
          })
          .from(hackathons)
          .where(ne(hackathons.id, id));

        const duplicate = findDuplicateByWebsite(others, patch.official_website, id);
        if (duplicate) {
          return reply.code(409).send({ error: "Duplicate official_website.", existing_id: duplicate.id });
        }
      }

      if (patch.is_shortlisted && !patch.shortlist_rationale && !current.shortlistRationale) {
        return reply.code(400).send({
          error: "Shortlisted records require shortlist_rationale.",
        });
      }

      const [row] = await db
        .update(hackathons)
        .set(toHackathonUpdate(patch))
        .where(eq(hackathons.id, id))
        .returning();

      return { data: hackathonToApi(row!) };
    } catch (error) {
      request.log.error(error);
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: "Duplicate official_website." });
      }
      return reply.code(500).send({ error: "Failed to update hackathon." });
    }
  });
};
