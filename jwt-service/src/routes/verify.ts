import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";
import { verifyAccessToken } from "../lib/token.js";

export const verifyRoutes: FastifyPluginAsync = async (app) => {
  app.post("/verify", async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ") || header.length <= "Bearer ".length) {
      return reply.code(401).send({ error: "Missing or invalid Authorization header." });
    }

    try {
      return await verifyAccessToken(header.slice("Bearer ".length), env.JWT_SECRET, env.JWT_ISSUER);
    } catch {
      return reply.code(401).send({ error: "Invalid or expired token." });
    }
  });
};
