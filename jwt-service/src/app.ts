import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import type { UserStore } from "./db/users.js";
import { authorizeGatewayCaller } from "./lib/gateway-auth.js";
import { buildFastifyLogger, logCompletedRequest } from "./lib/logger.js";
import { hashPassword } from "./lib/password.js";
import { healthRoutes } from "./routes/health.js";
import { loginRoutes } from "./routes/login.js";

export type BuildAppOptions = {
  userStore: UserStore;
  checkDatabase?: () => Promise<boolean>;
  dummyPasswordHash?: string;
};

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildFastifyLogger({
      level: env.LOG_LEVEL,
      nodeEnv: env.NODE_ENV,
      serviceName: env.SERVICE_NAME,
      logFilePath: env.LOG_FILE_PATH,
    }),
    requestIdHeader: "x-request-id",
    genReqId: (request) =>
      (request.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID(),
  });

  const dummyPasswordHash =
    options.dummyPasswordHash ?? (await hashPassword("jwt-service-dummy-password", env.BCRYPT_ROUNDS));

  app.addHook("onRequest", async (request, reply) => {
    const denied = authorizeGatewayCaller(
      request.url,
      request.headers,
      env.GATEWAY_INTERNAL_SECRET,
      env.SERVICE_NAME,
    );
    if (denied) {
      return reply.code(denied.status).send(denied.body);
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    logCompletedRequest(request, reply, env.SERVICE_NAME, "jwt-service request completed");
  });

  await app.register(cors, { origin: true });
  await app.register(healthRoutes(options.checkDatabase));
  await app.register(loginRoutes(options.userStore, dummyPasswordHash));

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.warn({ err: error, requestId: request.id }, "validation failed");
      return reply.code(400).send({
        error: "Validation failed.",
        details: error.flatten(),
      });
    }

    request.log.error({ err: error, requestId: request.id }, "unhandled error");
    reply.code(500).send({ error: "Internal server error." });
  });

  return app;
}
