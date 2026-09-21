import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    await connectDatabase();
  } catch {
    console.error("API failed to connect to PostgreSQL. Check DATABASE_URL and confirm PostgreSQL is running.");
    await disconnectDatabase().catch(() => undefined);
    process.exitCode = 1;
    return;
  }

  const server = app.listen(env.PORT, () => {
    console.log(`Make My Marriage API listening on http://localhost:${env.PORT}`);
  });

  server.on("error", async (error: NodeJS.ErrnoException) => {
    console.error("API failed to start", error.code);
    await disconnectDatabase().catch(() => undefined);
    process.exitCode = 1;
  });

  function shutdown() {
    server.close(async (error) => {
      if (error) {
        console.error("API failed to shut down cleanly");
        process.exitCode = 1;
      }

      await disconnectDatabase().catch(() => {
        console.error("API failed to disconnect from PostgreSQL cleanly");
        process.exitCode = 1;
      });
    });
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void startServer();
