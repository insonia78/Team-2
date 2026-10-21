import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { env } from "../config/env.js";
import { GATEWAY_CALLER, GATEWAY_CALLER_HEADER, GATEWAY_SECRET_HEADER } from "../lib/upstream-headers.js";

const loginBody = z.object({
  email: z
    .string()
    .trim()
    .min(3)
    .refine((value) => /^[^\s@]+@[^\s@]+$/.test(value), { message: "Invalid email." }),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: 60_000,
        },
      },
    },
    async (request, reply) => {
      const parsed = loginBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed.",
          details: parsed.error.flatten(),
        });
      }

      if (!env.GATEWAY_INTERNAL_SECRET) {
        return reply.code(503).send({
          error: "Gateway secret is not configured.",
          env: "GATEWAY_INTERNAL_SECRET",
        });
      }

      const target = new URL("/login", env.JWT_SERVICE_URL.endsWith("/") ? env.JWT_SERVICE_URL : `${env.JWT_SERVICE_URL}/`);

      let response: Response;
      try {
        response = await fetch(target, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            [GATEWAY_CALLER_HEADER]: GATEWAY_CALLER,
            [GATEWAY_SECRET_HEADER]: env.GATEWAY_INTERNAL_SECRET,
          },
          body: JSON.stringify(parsed.data),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        request.log.error({ err: message, requestId: request.id }, "jwt service unreachable");
        return reply.code(502).send({ error: "Gateway failed to reach the JWT service." });
      }

      const text = await response.text();
      try {
        const payload = text ? JSON.parse(text) : { error: "JWT service returned an empty response." };
        return reply.code(response.status).send(payload);
      } catch {
        return reply.code(502).send({ error: "JWT service returned an invalid response." });
      }
    },
  );

  app.get("/api/auth/me", async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: "Missing or invalid Authorization header." });
    }

    return {
      id: request.authUser.id,
      email: request.authUser.email,
      role: request.authUser.role,
      expiresAt: request.authUser.expiresAt,
    };
  });
};
