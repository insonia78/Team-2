import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { findDuplicateByWebsite } from "../lib/dedupe.js";
import { supabase } from "../lib/supabase.js";
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

    let builder = supabase
      .from("hackathons")
      .select("*")
      .order("registration_deadline", { ascending: true, nullsFirst: false })
      .limit(query.limit);

    if (query.status) builder = builder.eq("status", query.status);
    if (query.confidence) builder = builder.eq("confidence", query.confidence);
    if (query.format) builder = builder.eq("format", query.format);
    if (query.shortlisted !== undefined) builder = builder.eq("is_shortlisted", query.shortlisted);

    const { data, error } = await builder;
    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to list hackathons." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/apply-now", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("status", "Verified - Apply Now")
      .order("registration_deadline", { ascending: true });

    if (error) {
      return reply.code(500).send({ error: "Failed to load Apply Now view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/prepare-before-opening", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("status", "Verified - Registration Upcoming")
      .order("registration_deadline", { ascending: true });

    if (error) {
      return reply.code(500).send({ error: "Failed to load Prepare Before Opening view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/monitor", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("status", "Monitor")
      .order("event_start", { ascending: true, nullsFirst: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to load monitor view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/shortlist", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .eq("is_shortlisted", true)
      .order("registration_deadline", { ascending: true, nullsFirst: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to load shortlist view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/virtual-hybrid", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .in("format", ["virtual", "hybrid"])
      .order("registration_deadline", { ascending: true, nullsFirst: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to load virtual/hybrid view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/travel-supported", async (_request, reply) => {
    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .not("travel_support", "is", null)
      .neq("travel_support", "")
      .neq("travel_support", "not confirmed")
      .neq("travel_support", "not provided")
      .order("registration_deadline", { ascending: true, nullsFirst: false });

    if (error) {
      return reply.code(500).send({ error: "Failed to load travel-supported view." });
    }

    return { data, count: data.length };
  });

  app.get("/api/hackathons/views/deadlines", async (request, reply) => {
    const { withinDays } = deadlineQuerySchema.parse(request.query);
    const now = new Date();
    const upper = new Date(now);
    upper.setDate(upper.getDate() + withinDays);

    const { data, error } = await supabase
      .from("hackathons")
      .select("*")
      .gte("registration_deadline", now.toISOString())
      .lte("registration_deadline", upper.toISOString())
      .order("registration_deadline", { ascending: true });

    if (error) {
      return reply.code(500).send({ error: "Failed to load deadline view." });
    }

    return { data, count: data.length, withinDays };
  });

  app.get("/api/hackathons/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase.from("hackathons").select("*").eq("id", id).maybeSingle();

    if (error) {
      return reply.code(500).send({ error: "Failed to fetch hackathon." });
    }
    if (!data) {
      return reply.code(404).send({ error: "Hackathon not found." });
    }

    return { data };
  });

  app.post("/api/hackathons", async (request, reply) => {
    const payload = hackathonCreateSchema.parse(request.body);

    try {
      assertVerificationRules(payload);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : "Invalid verification data." });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("hackathons")
      .select("id, event_name, official_website");

    if (existingError) {
      return reply.code(500).send({ error: "Failed to check duplicates." });
    }

    const existing = findDuplicateByWebsite(existingRows ?? [], payload.official_website);
    if (existing) {
      return reply.code(409).send({
        error: "Duplicate official_website.",
        existing_id: existing.id,
        existing_event_name: existing.event_name,
      });
    }

    const { data, error } = await supabase.from("hackathons").insert(payload).select("*").single();

    if (error) {
      request.log.error(error);
      if (error.code === "23505") {
        return reply.code(409).send({ error: "Duplicate official_website." });
      }
      return reply.code(500).send({ error: "Failed to create hackathon." });
    }

    return reply.code(201).send({ data });
  });

  app.patch("/api/hackathons/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const patch = hackathonUpdateSchema.parse(request.body);

    const { data: current, error: currentError } = await supabase
      .from("hackathons")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      return reply.code(500).send({ error: "Failed to load hackathon." });
    }
    if (!current) {
      return reply.code(404).send({ error: "Hackathon not found." });
    }

    const merged = { ...current, ...patch };

    try {
      assertVerificationRules(merged);
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : "Invalid verification data." });
    }

    if (patch.official_website) {
      const { data: rows, error: dupError } = await supabase
        .from("hackathons")
        .select("id, official_website")
        .neq("id", id);

      if (dupError) {
        return reply.code(500).send({ error: "Failed to check duplicates." });
      }

      const duplicate = findDuplicateByWebsite(rows ?? [], patch.official_website, id);
      if (duplicate) {
        return reply.code(409).send({ error: "Duplicate official_website.", existing_id: duplicate.id });
      }
    }

    if (patch.is_shortlisted && !patch.shortlist_rationale && !current.shortlist_rationale) {
      return reply.code(400).send({
        error: "Shortlisted records require shortlist_rationale.",
      });
    }

    const { data, error } = await supabase.from("hackathons").update(patch).eq("id", id).select("*").single();

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to update hackathon." });
    }

    return { data };
  });
};
