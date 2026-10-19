import { and, asc, eq, gte, inArray, isNotNull, lte, ne } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { db } from "../db/client.js";
import { hackathonToApi, toHackathonInsert, toHackathonUpdate } from "../db/mappers.js";
import { hackathons } from "../db/schema.js";
import { findDuplicateByWebsite } from "../lib/dedupe.js";
import { mapDatabaseError } from "../lib/pg-errors.js";
import { assertShortlistRules, assertVerificationRules } from "../lib/verification.js";
import {
  hackathonCreateSchema,
  hackathonListQuerySchema,
  hackathonUpdateSchema,
} from "../schemas/hackathon.js";

const deadlineQuerySchema = z.object({
  withinDays: z.coerce.number().int().min(1).max(365).default(30),
});

function rejectRule(request: FastifyRequest, reply: FastifyReply, err: unknown) {
  const message = err instanceof Error ? err.message : "Invalid verification data.";
  request.log.warn({ requestId: request.id, reason: message }, "record rejected by research rules");
  return reply.code(400).send({ error: message });
}

function replyForDatabaseError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  fallback: string,
) {
  const mapped = mapDatabaseError(error);
  if (mapped) {
    request.log.warn({ err: error, requestId: request.id }, mapped.error);
    return reply.code(mapped.statusCode).send({ error: mapped.error });
  }

  request.log.error({ err: error, requestId: request.id }, fallback);
  return reply.code(500).send({ error: fallback });
}

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
      request.log.error({ err: error, requestId: request.id }, "failed to list hackathons");
      return reply.code(500).send({ error: "Failed to list hackathons." });
    }
  });

  app.get("/api/hackathons/views/apply-now", async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Verified - Apply Now"))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load Apply Now view");
      return reply.code(500).send({ error: "Failed to load Apply Now view." });
    }
  });

  app.get("/api/hackathons/views/prepare-before-opening", async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Verified - Registration Upcoming"))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load Prepare Before Opening view");
      return reply.code(500).send({ error: "Failed to load Prepare Before Opening view." });
    }
  });

  app.get("/api/hackathons/views/monitor", async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.status, "Monitor"))
        .orderBy(asc(hackathons.eventStart));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load monitor view");
      return reply.code(500).send({ error: "Failed to load monitor view." });
    }
  });

  app.get("/api/hackathons/views/shortlist", async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.isShortlisted, true))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load shortlist view");
      return reply.code(500).send({ error: "Failed to load shortlist view." });
    }
  });

  app.get("/api/hackathons/views/virtual-hybrid", async (request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(inArray(hackathons.format, ["virtual", "hybrid"]))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load virtual/hybrid view");
      return reply.code(500).send({ error: "Failed to load virtual/hybrid view." });
    }
  });

  app.get("/api/hackathons/views/travel-supported", async (request, reply) => {
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
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load travel-supported view");
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
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to load deadline view");
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
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to fetch hackathon");
      return reply.code(500).send({ error: "Failed to fetch hackathon." });
    }
  });

  app.post("/api/hackathons", async (request, reply) => {
    const payload = hackathonCreateSchema.parse(request.body);

    try {
      assertVerificationRules(payload);
      assertShortlistRules(payload);
    } catch (err) {
      return rejectRule(request, reply, err);
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
      request.log.info(
        { action: "hackathon_created", id: row!.id, eventName: row!.eventName, requestId: request.id },
        "hackathon created",
      );
      return reply.code(201).send({ data: hackathonToApi(row!) });
    } catch (error) {
      return replyForDatabaseError(request, reply, error, "Failed to create hackathon.");
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
        assertShortlistRules({
          is_shortlisted: merged.is_shortlisted,
          shortlist_rationale: merged.shortlist_rationale,
        });
      } catch (err) {
        return rejectRule(request, reply, err);
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

      const [row] = await db
        .update(hackathons)
        .set(toHackathonUpdate(patch))
        .where(eq(hackathons.id, id))
        .returning();

      request.log.info(
        { action: "hackathon_updated", id: row!.id, eventName: row!.eventName, requestId: request.id },
        "hackathon updated",
      );
      return { data: hackathonToApi(row!) };
    } catch (error) {
      return replyForDatabaseError(request, reply, error, "Failed to update hackathon.");
    }
  });
};
