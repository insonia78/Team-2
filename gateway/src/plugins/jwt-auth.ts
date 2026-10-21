import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env.js";
import { roleAllowsMethod, verifyAccessToken, type AuthUser } from "../lib/jwt.js";
import { attachAuthUser } from "../lib/upstream-headers.js";

const PROXIED_PREFIXES = [
  "/api/hackathons",
  "/api/organizer-followups",
  "/api/exports",
  "/api/ai",
  "/api/scraper",
];

type BearerResult =
  | { status: "anonymous" }
  | { status: "unconfigured" }
  | { status: "invalid" }
  | { status: "ok"; user: AuthUser };

export function normalizePath(url: string): string {
  const path = url.split("?")[0] ?? url;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function isPublicRoute(method: string, path: string): boolean {
  if (method === "GET" && (path === "/health" || path === "/health/live" || path === "/health/ready")) {
    return true;
  }
  if (method === "GET" && path === "/gateway/routes") {
    return true;
  }
  return method === "POST" && path === "/api/auth/login";
}

function isProxiedApi(path: string): boolean {
  return PROXIED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

async function readBearer(request: FastifyRequest): Promise<BearerResult> {
  const header = request.headers.authorization;
  if (!header) {
    return { status: "anonymous" };
  }
  if (!env.JWT_SECRET) {
    return { status: "unconfigured" };
  }
  if (!header.startsWith("Bearer ") || header.length <= "Bearer ".length) {
    return { status: "invalid" };
  }

  try {
    const user = await verifyAccessToken(header.slice("Bearer ".length), env.JWT_SECRET, env.JWT_ISSUER);
    return { status: "ok", user };
  } catch {
    return { status: "invalid" };
  }
}

function rejectBearer(result: BearerResult, reply: FastifyReply): boolean {
  if (result.status === "unconfigured") {
    reply.code(503).send({
      error: "JWT authentication is not configured.",
      env: "JWT_SECRET",
    });
    return true;
  }
  if (result.status === "anonymous") {
    reply.code(401).send({ error: "Missing or invalid Authorization header." });
    return true;
  }
  if (result.status === "invalid") {
    reply.code(401).send({ error: "Invalid or expired token." });
    return true;
  }
  return false;
}

const jwtAuthPluginImpl: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS") {
      return;
    }

    const path = normalizePath(request.url);
    if (isPublicRoute(request.method, path)) {
      return;
    }

    if (path === "/admin" || path.startsWith("/admin/")) {
      const result = await readBearer(request);
      if (result.status === "anonymous") {
        return;
      }
      if (rejectBearer(result, reply) || result.status !== "ok") {
        return;
      }
      attachAuthUser(request, result.user);
      return;
    }

    if (!path.startsWith("/api/")) {
      return;
    }

    if (!env.JWT_SECRET) {
      return reply.code(503).send({
        error: "JWT authentication is not configured.",
        env: "JWT_SECRET",
      });
    }

    const result = await readBearer(request);
    if (rejectBearer(result, reply) || result.status !== "ok") {
      return;
    }
    if (!roleAllowsMethod(result.user.role, request.method)) {
      return reply.code(403).send({ error: "This role cannot perform that action." });
    }

    attachAuthUser(request, result.user);

    if (isProxiedApi(path) && !env.GATEWAY_INTERNAL_SECRET) {
      return reply.code(503).send({
        error: "Gateway secret is not configured.",
        env: "GATEWAY_INTERNAL_SECRET",
      });
    }
  });
};

export const jwtAuthPlugin = fp(jwtAuthPluginImpl, {
  name: "team-2-jwt-auth",
});
