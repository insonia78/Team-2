import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createGatewayApp } from "./create-gateway-app.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("gateway routes", () => {
  it("lists hackathon upstreams and marks unconfigured services", async () => {
    app = await createGatewayApp();

    const response = await app.inject({ method: "GET", url: "/gateway/routes" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: "team-2-gateway",
      role: "api-gateway",
      routes: [
        { path: "/api/hackathons/*", upstream: "http://127.0.0.1:4001" },
        { path: "/api/organizer-followups/*", upstream: "http://127.0.0.1:4001" },
        { path: "/api/exports/*", upstream: "http://127.0.0.1:4001" },
        { path: "/api/ai/*", upstream: "not configured" },
        { path: "/api/scraper/*", upstream: "not configured" },
        { path: "/proxy/graphql", upstream: "not configured" },
      ],
    });
  });

  it("returns 503 for AI and GraphQL when those upstreams are not set", async () => {
    app = await createGatewayApp();

    const ai = await app.inject({ method: "GET", url: "/api/ai/ping" });
    const graphql = await app.inject({ method: "POST", url: "/proxy/graphql" });

    expect(ai.statusCode).toBe(503);
    expect(ai.json()).toEqual({
      error: "AI service is not configured.",
      env: "AI_SERVICE_URL",
    });
    expect(graphql.statusCode).toBe(503);
    expect(graphql.json()).toEqual({
      error: "GraphQL proxy upstream is not configured.",
      env: "PROXY_GRAPHQL_UPSTREAM_URL",
    });
  });
});
