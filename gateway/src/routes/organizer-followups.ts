import type { FastifyPluginAsync } from "fastify";

import { supabase } from "../lib/supabase.js";
import { followupCreateSchema, followupUpdateSchema } from "../schemas/followup.js";

export const organizerFollowupRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/organizer-followups", async (_request, reply) => {
    const { data, error } = await supabase
      .from("organizer_followups")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to list organizer follow-ups." });
    }

    return { data, count: data.length };
  });

  app.post("/api/organizer-followups", async (request, reply) => {
    const payload = followupCreateSchema.parse(request.body);

    if (payload.confirmed_answer && payload.response_status === "Pending") {
      return reply.code(400).send({
        error: "Cannot store confirmed_answer while response_status is Pending.",
      });
    }

    const { data, error } = await supabase
      .from("organizer_followups")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to create organizer follow-up." });
    }

    return reply.code(201).send({ data });
  });

  app.patch("/api/organizer-followups/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = followupUpdateSchema.parse(request.body);

    const { data, error } = await supabase
      .from("organizer_followups")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to update organizer follow-up." });
    }

    return { data };
  });
};
