import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const serviceRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: join(serviceRoot, ".env") });

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : undefined;
  });

const envSchema = z
  .object({
    PORT: z.coerce.number().default(4004),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SERVICE_NAME: z.string().default("jwt-service"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    LOG_FILE_PATH: optionalText,

    DATABASE_URL: z.string().min(1),
    DATABASE_SSL: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),

    JWT_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("team-2-gateway"),
    JWT_TTL_SECONDS: z.coerce.number().int().positive().default(2 * 60 * 60),
    INVITE_URL_BASE: z.string().trim().min(1).default("http://localhost:3000/accept-invite"),
    INVITE_TTL_SECONDS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60),
    GATEWAY_INTERNAL_SECRET: z.string().min(16),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

    SEED_VIEWER_EMAIL: optionalText,
    SEED_VIEWER_PASSWORD: optionalText,
    SEED_RESEARCHER_EMAIL: optionalText,
    SEED_RESEARCHER_PASSWORD: optionalText,
    SEED_ADMIN_EMAIL: optionalText,
    SEED_ADMIN_PASSWORD: optionalText,
  });

export type JwtEnv = z.infer<typeof envSchema>;

export const env: JwtEnv = envSchema.parse(process.env);
