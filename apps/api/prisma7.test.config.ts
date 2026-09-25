import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getSafeTestDatabaseTarget } from "./src/config/test-database.ts";

const testDatabase = getSafeTestDatabaseTarget();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: testDatabase.connectionString,
  },
});
