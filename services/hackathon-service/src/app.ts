import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import { exportRoutes } from "./routes/exports.js";
import { hackathonRoutes } from "./routes/hackathons.js";
import { healthRoutes } from "./routes/health.js";
import { organizerFollowupRoutes } from "./routes/organizer-followups.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    requestIdHeader: "x-request-id",
    genReqId: (request) =>
      (request.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID(),
  });

  await app.register(cors, { origin: true });
  await app.register(healthRoutes);
  await app.register(hackathonRoutes);
  await app.register(organizerFollowupRoutes);
  await app.register(exportRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Validation failed.",
        details: error.flatten(),
      });
    }

    reply.code(500).send({ error: "Internal server error." });
  });

  return app;
}
