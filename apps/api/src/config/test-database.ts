const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const SAFE_TEST_DATABASE_NAME = /^[a-z][a-z0-9_]*_test$/;

export type SafeTestDatabaseTarget = {
  connectionString: string;
  databaseName: string;
  isLocal: boolean;
  adminConnectionString: string;
};

function parsePostgresUrl(name: string, value: string | undefined): URL {
  if (!value) throw new Error(`${name} is required for database tests.`);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection URL.`);
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error(`${name} must use the PostgreSQL protocol.`);
  }

  return url;
}

function databaseName(url: URL): string {
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!name || name.includes("/")) throw new Error("Database URLs must contain one database name.");
  return name;
}

export function getSafeTestDatabaseTarget(source: NodeJS.ProcessEnv = process.env): SafeTestDatabaseTarget {
  const developmentUrl = parsePostgresUrl("DATABASE_URL", source["DATABASE_URL"]);
  const testUrl = parsePostgresUrl("TEST_DATABASE_URL", source["TEST_DATABASE_URL"]);
  const developmentDatabase = databaseName(developmentUrl);
  const testDatabase = databaseName(testUrl);

  if (developmentDatabase === testDatabase) {
    throw new Error("TEST_DATABASE_URL must not target the normal development database.");
  }

  if (!SAFE_TEST_DATABASE_NAME.test(testDatabase)) {
    throw new Error("The test database name must end with _test and contain only lowercase letters, numbers, and underscores.");
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.searchParams.delete("schema");

  return {
    connectionString: testUrl.toString(),
    databaseName: testDatabase,
    isLocal: LOCAL_DATABASE_HOSTS.has(testUrl.hostname.toLowerCase()),
    adminConnectionString: adminUrl.toString(),
  };
}

export function configureTestDatabaseEnvironment(source: NodeJS.ProcessEnv = process.env): SafeTestDatabaseTarget {
  const target = getSafeTestDatabaseTarget(source);
  source["DATABASE_URL"] = target.connectionString;
  return target;
}
