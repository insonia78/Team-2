import proxy from "@fastify/http-proxy";
import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";

export const serviceProxyRoutes: FastifyPluginAsync = async (app) => {
  await app.register(proxy, {
    upstream: env.HACKATHON_SERVICE_URL,
    prefix: "/api/hackathons",
    rewritePrefix: "/api/hackathons",
  });

  await app.register(proxy, {
    upstream: env.HACKATHON_SERVICE_URL,
    prefix: "/api/organizer-followups",
    rewritePrefix: "/api/organizer-followups",
  });

  await app.register(proxy, {
    upstream: env.HACKATHON_SERVICE_URL,
    prefix: "/api/exports",
    rewritePrefix: "/api/exports",
  });

  if (env.AI_SERVICE_URL) {
    await app.register(proxy, {
      upstream: env.AI_SERVICE_URL,
      prefix: "/api/ai",
      rewritePrefix: "/api/ai",
    });
    app.log.info({ upstream: env.AI_SERVICE_URL }, "AI service route enabled");
  } else {
    app.all("/api/ai/*", async (_request, reply) => {
      reply.code(503).send({
        error: "AI service is not configured.",
        env: "AI_SERVICE_URL",
      });
    });
  }

  if (env.SCRAPER_SERVICE_URL) {
    await app.register(proxy, {
      upstream: env.SCRAPER_SERVICE_URL,
      prefix: "/api/scraper",
      rewritePrefix: "/api/scraper",
    });
    app.log.info({ upstream: env.SCRAPER_SERVICE_URL }, "Scraper service route enabled");
  } else {
    app.all("/api/scraper/*", async (_request, reply) => {
      reply.code(503).send({
        error: "Scraper service is not configured.",
        env: "SCRAPER_SERVICE_URL",
      });
    });
  }
};
