import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";

async function checkDownstream(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health/ready`);
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    service: env.SERVICE_NAME,
    role: "api-gateway",
    timestamp: new Date().toISOString(),
  }));

  app.get("/health/live", async () => ({
    ok: true,
    check: "liveness",
    service: env.SERVICE_NAME,
    role: "api-gateway",
  }));

  app.get("/health/ready", async (_request, reply) => {
    const hackathonOk = await checkDownstream(env.HACKATHON_SERVICE_URL);

    if (!hackathonOk) {
      return reply.code(503).send({
        ok: false,
        check: "readiness",
        service: env.SERVICE_NAME,
        role: "api-gateway",
        downstream: {
          hackathon_service: "unavailable",
        },
      });
    }

    return {
      ok: true,
      check: "readiness",
      service: env.SERVICE_NAME,
      role: "api-gateway",
      downstream: {
        hackathon_service: "ok",
      },
    };
  });
};
