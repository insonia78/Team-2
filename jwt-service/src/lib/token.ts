import { jwtVerify, SignJWT } from "jose";

import { isRole, type Role } from "./roles.js";

const encoder = new TextEncoder();

export type TokenSubject = {
  id: string;
  email: string;
  role: Role;
};

export async function signAccessToken(
  user: TokenSubject,
  options: { secret: string; issuer: string; ttlSeconds: number; now?: number },
): Promise<{ token: string; expiresAt: string }> {
  const issuedAt = options.now ?? Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + options.ttlSeconds;
  const token = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(options.issuer)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAtSeconds)
    .sign(encoder.encode(options.secret));

  return {
    token,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}

export type VerifiedToken = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
};

export async function verifyAccessToken(
  token: string,
  secret: string,
  issuer: string,
): Promise<VerifiedToken> {
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
