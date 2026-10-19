import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "test") {
  config();
}

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

  HACKATHON_SERVICE_URL: z.string().url().default("http://127.0.0.1:4001"),
  AI_SERVICE_URL: z.string().url().optional(),
  SCRAPER_SERVICE_URL: z.string().url().optional(),

  ADMIN_API_KEY: z.string().optional(),

  IP_ALLOWLIST: csvList,
  IP_BLOCKLIST: csvList,
  PATH_BLOCKLIST: csvList,

  PROXY_GRAPHQL_UPSTREAM_URL: z.string().url().optional(),

  RATE_LIMIT_MAX: z.coerce.number().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
});

export type GatewayEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): GatewayEnv {
  return envSchema.parse(source);
}

export const env = loadEnv();
