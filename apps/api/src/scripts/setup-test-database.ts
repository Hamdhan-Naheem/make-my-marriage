import { Client } from "pg";
import { getSafeTestDatabaseTarget } from "../config/test-database.js";

async function canConnect(connectionString: string): Promise<boolean> {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "3D000") return false;
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function setupTestDatabase() {
  const target = getSafeTestDatabaseTarget();

  if (await canConnect(target.connectionString)) {
    console.log(`Test database ${target.databaseName} is ready.`);
    return;
  }

  if (!target.isLocal) {
    throw new Error("The configured remote test database does not exist. Provision it outside this local setup command.");
  }

  const adminClient = new Client({ connectionString: target.adminConnectionString });
  await adminClient.connect();
  try {
    const existing = await adminClient.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists",
      [target.databaseName],
    );

    if (!existing.rows[0]?.exists) {
      await adminClient.query(`CREATE DATABASE "${target.databaseName}"`);
      console.log(`Created local test database ${target.databaseName}.`);
    }
  } finally {
    await adminClient.end();
  }

  if (!await canConnect(target.connectionString)) {
    throw new Error(`Test database ${target.databaseName} was created but is not reachable.`);
  }

  console.log(`Test database ${target.databaseName} is ready.`);
}

setupTestDatabase().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Test database setup failed.");
  process.exitCode = 1;
});
