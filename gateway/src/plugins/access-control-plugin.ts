import type { FastifyPluginAsync } from "fastify";

import { evaluateAccess, seedRuntimeBlocklists } from "../lib/access-control.js";

export const accessControlPlugin: FastifyPluginAsync = async (app) => {
  seedRuntimeBlocklists();

  app.addHook("onRequest", async (request, reply) => {
    const result = evaluateAccess(request);
    if (!result.allowed) {
      request.log.warn({ ip: request.ip, path: request.url, reason: result.reason }, "access denied");
      return reply.code(403).send({ error: result.reason ?? "Access denied." });
    }
  });
};
