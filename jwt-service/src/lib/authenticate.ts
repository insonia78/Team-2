import type { AppUser, UserStore } from "../db/users.js";
import { verifyPassword } from "./password.js";

export async function authenticate(
  store: UserStore,
  email: string,
  password: string,
  dummyPasswordHash: string,
): Promise<AppUser | null> {
  const normalized = email.trim().toLowerCase();
  const user = await store.findByEmail(normalized);
  const passwordHash = user?.passwordHash ?? dummyPasswordHash;
  const matches = await verifyPassword(password, passwordHash).catch(() => false);
  if (!user || !matches) {
    return null;
  }
  return user;
}
