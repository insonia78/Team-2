import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { createPgUserDirectory } from "./db/users.js";
import { applySeedUsers } from "./lib/seed.js";

const directory = createPgUserDirectory(env);
const app = await buildApp({
  userStore: directory,
  invitationStore: directory,
  checkDatabase: () => directory.check(),
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutting down jwt-service");
  await app.close();
  await directory.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  const seeded = await applySeedUsers(directory, env);
  app.log.info({ seeded }, "app user seed complete");
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  const logTarget = env.LOG_FILE_PATH ? "stdout and file" : "stdout";
  app.log.info(
    { port: env.PORT, service: env.SERVICE_NAME, logFile: env.LOG_FILE_PATH ?? null },
    `jwt-service listening; logging to ${logTarget}`,
  );
} catch (err) {
  app.log.error(err);
  await directory.close();
  process.exit(1);
}
