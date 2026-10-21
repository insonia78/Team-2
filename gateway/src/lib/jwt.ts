import { jwtVerify } from "jose";

export const ROLES = ["viewer", "researcher", "admin"] as const;

export type Role = (typeof ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
};

const encoder = new TextEncoder();

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.some((role) => role === value);
}

const READ_METHODS = new Set(["GET", "HEAD"]);
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);

export function roleAllowsMethod(role: Role, method: string): boolean {
  if (role === "admin") {
    return true;
  }
  if (READ_METHODS.has(method)) {
    return role === "viewer" || role === "researcher";
  }
  if (WRITE_METHODS.has(method)) {
    return role === "researcher";
  }
  return false;
}

export async function verifyAccessToken(
  token: string,
  secret: string,
  issuer: string,
): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, encoder.encode(secret), {
    issuer,
    algorithms: ["HS256"],
  });

  const expiresAtSeconds = payload.exp;
  if (!payload.sub || typeof payload.email !== "string" || !isRole(payload.role)) {
    throw new Error("Token is missing required claims.");
  }
  if (typeof expiresAtSeconds !== "number") {
    throw new Error("Token is missing an expiry.");
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}
