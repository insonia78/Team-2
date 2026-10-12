import { config } from "dotenv";
import { z } from "zod";

config();

const csvList = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  );

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SERVICE_NAME: z.string().default("team-2-gateway"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_FILE_PATH: z.string().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  ADMIN_API_KEY: z.string().optional(),

  IP_ALLOWLIST: csvList,
  IP_BLOCKLIST: csvList,
  PATH_BLOCKLIST: csvList,

  PROXY_REST_UPSTREAM_URL: z.string().url().optional(),
  PROXY_GRAPHQL_UPSTREAM_URL: z.string().url().optional(),

  RATE_LIMIT_MAX: z.coerce.number().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
});

export const env = envSchema.parse(process.env);
