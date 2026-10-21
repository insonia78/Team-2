import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import type { UserStore } from "../db/users.js";
import { env } from "../config/env.js";
import { authenticate } from "../lib/authenticate.js";
import { signAccessToken } from "../lib/token.js";

const loginBody = z.object({
  email: z
    .string()
    .trim()
    .min(3)
    .refine((value) => /^[^\s@]+@[^\s@]+$/.test(value), { message: "Invalid email." }),
  password: z.string().min(1),
});

export function loginRoutes(store: UserStore, dummyPasswordHash: string): FastifyPluginAsync {
  return async (app) => {
    app.post("/login", async (request, reply) => {
      const parsed = loginBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed.",
          details: parsed.error.flatten(),
        });
      }

      const user = await authenticate(store, parsed.data.email, parsed.data.password, dummyPasswordHash);
      if (!user) {
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      const signed = await signAccessToken(
        { id: user.id, email: user.email, role: user.role },
        {
          secret: env.JWT_SECRET,
          issuer: env.JWT_ISSUER,
          ttlSeconds: env.JWT_TTL_SECONDS,
        },
      );

      return {
        token: signed.token,
        expiresAt: signed.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    });
  };
}
