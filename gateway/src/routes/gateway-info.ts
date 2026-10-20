import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";

export const gatewayInfoRoutes: FastifyPluginAsync = async (app) => {
  app.get("/gateway/routes", async () => ({
    service: env.SERVICE_NAME,
    role: "api-gateway",
    routes: [
      { path: "/api/hackathons/*", upstream: env.HACKATHON_SERVICE_URL },
      { path: "/api/organizer-followups/*", upstream: env.HACKATHON_SERVICE_URL },
      { path: "/api/exports/*", upstream: env.HACKATHON_SERVICE_URL },
      { path: "/api/ai/*", upstream: env.AI_SERVICE_URL ?? "not configured" },
      { path: "/api/scraper/*", upstream: env.SCRAPER_SERVICE_URL ?? "not configured" },
      { path: "/proxy/graphql", upstream: env.PROXY_GRAPHQL_UPSTREAM_URL ?? "not configured" },
    ],
  }));
};
