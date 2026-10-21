import pg from "pg";

import type { JwtEnv } from "../config/env.js";
import { isRole, type Role } from "../lib/roles.js";

export type AppUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
};

export type UserStore = {
  findByEmail(email: string): Promise<AppUser | null>;
};

export type UserDirectory = UserStore & {
  upsert(user: { email: string; passwordHash: string; role: Role }): Promise<void>;
  check(): Promise<boolean>;
  close(): Promise<void>;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
};

export function createPgUserDirectory(source: Pick<JwtEnv, "DATABASE_URL" | "DATABASE_SSL">): UserDirectory {
  const pool = new pg.Pool({
    connectionString: source.DATABASE_URL,
    max: 5,
    ssl: source.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  });

  return {
    async findByEmail(email: string) {
      const result = await pool.query<UserRow>(
        `select id, email, password_hash, role
         from hackathon_research.app_users
         where email = $1`,
        [email],
      );
      return mapUser(result.rows[0]);
    },
    async upsert(user) {
      await pool.query(
        `insert into hackathon_research.app_users (email, password_hash, role)
         values ($1, $2, $3)
         on conflict (email) do update
         set password_hash = excluded.password_hash,
             role = excluded.role`,
        [user.email, user.passwordHash, user.role],
      );
    },
    async check() {
      try {
        await pool.query("select 1");
        return true;
      } catch {
        return false;
      }
    },
    async close() {
      await pool.end();
    },
  };
}

function mapUser(row: UserRow | undefined): AppUser | null {
  if (!row || !isRole(row.role)) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
  };
}
