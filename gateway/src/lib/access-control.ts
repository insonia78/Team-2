import type { FastifyRequest } from "fastify";

import { env } from "../config/env.js";

const runtimeBlockedPaths = new Set<string>();
const runtimeBlockedIps = new Set<string>();

export function seedRuntimeBlocklists(): void {
  env.PATH_BLOCKLIST.forEach((path) => runtimeBlockedPaths.add(path));
  env.IP_BLOCKLIST.forEach((ip) => runtimeBlockedIps.add(ip));
}

export function getAccessControlSnapshot() {
  return {
    ip_allowlist: env.IP_ALLOWLIST,
    ip_blocklist: [...env.IP_BLOCKLIST, ...runtimeBlockedIps],
    path_blocklist: [...env.PATH_BLOCKLIST, ...runtimeBlockedPaths],
    note: "Runtime blocklists reset when the process restarts.",
  };
}

export function blockPath(path: string): void {
  runtimeBlockedPaths.add(path);
}

export function blockIp(ip: string): void {
  runtimeBlockedIps.add(ip);
}

function requestIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? request.ip;
  }
  return request.ip;
}

export function evaluateAccess(request: FastifyRequest): { allowed: boolean; reason?: string } {
  const ip = requestIp(request);
  const path = request.url.split("?")[0] ?? request.url;

  const blocklist = [...env.IP_BLOCKLIST, ...runtimeBlockedIps];
  if (blocklist.includes(ip)) {
    return { allowed: false, reason: `IP ${ip} is blocked.` };
  }

  if (env.IP_ALLOWLIST.length > 0 && !env.IP_ALLOWLIST.includes(ip)) {
    return { allowed: false, reason: `IP ${ip} is not in allowlist.` };
  }

  const blockedPaths = [...env.PATH_BLOCKLIST, ...runtimeBlockedPaths];
  if (blockedPaths.some((blocked) => path.startsWith(blocked))) {
    return { allowed: false, reason: `Path ${path} is blocked.` };
  }

  return { allowed: true };
}
