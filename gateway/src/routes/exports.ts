import type { FastifyPluginAsync } from "fastify";

import { toCsv } from "../lib/csv.js";
import { supabase } from "../lib/supabase.js";

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/exports/master-database.csv", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .order("event_name", { ascending: true });

    if (error) {
      return reply.code(500).send({ error: "Failed to export master database." });
    }

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="master-hackathon-database.csv"');
    return toCsv(data ?? []);
  });

  app.get("/api/exports/shortlist.csv", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("is_shortlisted", true)
      .order("registration_deadline", { ascending: true });

    if (error) {
      return reply.code(500).send({ error: "Failed to export shortlist." });
    }

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="codyza-shortlist.csv"');
    return toCsv(data ?? []);
  });

  app.get("/api/exports/organizer-followups.csv", async (_request, reply) => {
    const { data, error } = await supabase
      .from("organizer_followups")
      .select("*")
      .order("sent_date", { ascending: true, nullsFirst: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to export organizer follow-ups." });
    }

    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header(
      "Content-Disposition",
      'attachment; filename="organizer-followup-log.csv"',
    );
    return toCsv(data ?? []);
  });
};
