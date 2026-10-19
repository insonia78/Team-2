import { desc, eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { db } from "../db/client.js";
import { followupToApi } from "../db/mappers.js";
import { organizerFollowups } from "../db/schema.js";
import { mapDatabaseError } from "../lib/pg-errors.js";
import { assertFollowupRules } from "../lib/verification.js";
import { followupCreateSchema, followupUpdateSchema } from "../schemas/followup.js";

export const organizerFollowupRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/organizer-followups", async (request, reply) => {
    try {
      const rows = await db.select().from(organizerFollowups).orderBy(desc(organizerFollowups.updatedAt));
      const data = rows.map(followupToApi);
      return { data, count: data.length };
    } catch (error) {
      request.log.error({ err: error, requestId: request.id }, "failed to list organizer follow-ups");
      return reply.code(500).send({ error: "Failed to list organizer follow-ups." });
    }
  });

  app.post("/api/organizer-followups", async (request, reply) => {
    const payload = followupCreateSchema.parse(request.body);

    try {
      assertFollowupRules(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid follow-up.";
      request.log.warn({ requestId: request.id, reason: message }, "record rejected by research rules");
      return reply.code(400).send({ error: message });
    }

    try {
      const [row] = await db
        .insert(organizerFollowups)
        .values({
          hackathonId: payload.hackathon_id,
          eventName: payload.event_name,
          question: payload.question,
          contactChannel: payload.contact_channel,
          assignedMember: payload.assigned_member,
          sentDate: payload.sent_date,
          responseStatus: payload.response_status,
          confirmedAnswer: payload.confirmed_answer,
        })
        .returning();

      request.log.info(
        {
          action: "followup_created",
          id: row!.id,
          eventName: row!.eventName,
          responseStatus: row!.responseStatus,
          requestId: request.id,
        },
        "organizer follow-up created",
      );
      return reply.code(201).send({ data: followupToApi(row!) });
    } catch (error) {
      const mapped = mapDatabaseError(error);
      if (mapped) {
        request.log.warn({ err: error, requestId: request.id }, mapped.error);
        return reply.code(mapped.statusCode).send({ error: mapped.error });
      }
      request.log.error({ err: error, requestId: request.id }, "failed to create organizer follow-up");
      return reply.code(500).send({ error: "Failed to create organizer follow-up." });
    }
  });

  app.patch("/api/organizer-followups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = followupUpdateSchema.parse(request.body);

    try {
      const existing = await db
        .select()
        .from(organizerFollowups)
        .where(eq(organizerFollowups.id, id))
        .limit(1);
      const current = existing[0];
      if (!current) {
        return reply.code(404).send({ error: "Organizer follow-up not found." });
      }

      try {
        assertFollowupRules({
          response_status: patch.response_status ?? current.responseStatus,
          confirmed_answer:
            patch.confirmed_answer !== undefined ? patch.confirmed_answer : current.confirmedAnswer,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid follow-up.";
        request.log.warn({ requestId: request.id, reason: message }, "record rejected by research rules");
        return reply.code(400).send({ error: message });
      }

      const update: Partial<typeof organizerFollowups.$inferInsert> = {};
      if (patch.hackathon_id !== undefined) update.hackathonId = patch.hackathon_id;
      if (patch.event_name !== undefined) update.eventName = patch.event_name;
      if (patch.question !== undefined) update.question = patch.question;
      if (patch.contact_channel !== undefined) update.contactChannel = patch.contact_channel;
      if (patch.assigned_member !== undefined) update.assignedMember = patch.assigned_member;
      if (patch.sent_date !== undefined) update.sentDate = patch.sent_date;
      if (patch.response_status !== undefined) update.responseStatus = patch.response_status;
      if (patch.confirmed_answer !== undefined) update.confirmedAnswer = patch.confirmed_answer;

      const [row] = await db
        .update(organizerFollowups)
        .set(update)
        .where(eq(organizerFollowups.id, id))
        .returning();

      if (!row) {
        return reply.code(404).send({ error: "Organizer follow-up not found." });
      }

      request.log.info(
        {
          action: "followup_updated",
          id: row.id,
          eventName: row.eventName,
          responseStatus: row.responseStatus,
          requestId: request.id,
        },
        "organizer follow-up updated",
      );
      return { data: followupToApi(row) };
    } catch (error) {
      const mapped = mapDatabaseError(error);
      if (mapped) {
        request.log.warn({ err: error, requestId: request.id }, mapped.error);
        return reply.code(mapped.statusCode).send({ error: mapped.error });
      }
      request.log.error({ err: error, requestId: request.id }, "failed to update organizer follow-up");
      return reply.code(500).send({ error: "Failed to update organizer follow-up." });
    }
  });
};
