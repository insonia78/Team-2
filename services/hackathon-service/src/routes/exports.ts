import { asc, eq } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";

import { db } from "../db/client.js";
import { followupToApi, hackathonToApi } from "../db/mappers.js";
import { hackathons, organizerFollowups } from "../db/schema.js";
import { toCsv } from "../lib/csv.js";

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/exports/master-database.csv", async (_request, reply) => {
    try {
      const rows = await db.select().from(hackathons).orderBy(asc(hackathons.eventName));
      const data = rows.map(hackathonToApi);

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", 'attachment; filename="master-hackathon-database.csv"');
      return toCsv(data);
    } catch {
      return reply.code(500).send({ error: "Failed to export master database." });
    }
  });

  app.get("/api/exports/shortlist.csv", async (_request, reply) => {
    try {
      const rows = await db
        .select()
        .from(hackathons)
        .where(eq(hackathons.isShortlisted, true))
        .orderBy(asc(hackathons.registrationDeadline));
      const data = rows.map(hackathonToApi);

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", 'attachment; filename="codyza-shortlist.csv"');
      return toCsv(data);
    } catch {
      return reply.code(500).send({ error: "Failed to export shortlist." });
    }
  });

  app.get("/api/exports/organizer-followups.csv", async (_request, reply) => {
    try {
      const rows = await db.select().from(organizerFollowups).orderBy(asc(organizerFollowups.sentDate));
      const data = rows.map(followupToApi);

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header(
        "Content-Disposition",
        'attachment; filename="organizer-followup-log.csv"',
      );
      return toCsv(data);
    } catch {
      return reply.code(500).send({ error: "Failed to export organizer follow-ups." });
    }
  });
};
