import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";
import { supabase } from "../lib/supabase.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  }));

  app.get("/health/live", async () => ({
    ok: true,
    check: "liveness",
    service: env.SERVICE_NAME,
  }));

  app.get("/health/ready", async (_request, reply) => {
    const { error } = await supabase.from("hackathons").select("id").limit(1);
    if (error) {
      return reply.code(503).send({
        ok: false,
        check: "readiness",
        service: env.SERVICE_NAME,
        database: "unavailable",
      });
    }

    return {
      ok: true,
      check: "readiness",
      service: env.SERVICE_NAME,
      database: "ok",
    };
  });
};
