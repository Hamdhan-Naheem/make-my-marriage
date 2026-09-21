import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSafeTestDatabaseTarget } from "../src/config/test-database.js";

const developmentUrl = "postgresql://user:password@127.0.0.1:5433/make_my_marriage?schema=public";

describe("test database safety", () => {
  it("accepts a separate database with a safe test-only name", () => {
    const target = getSafeTestDatabaseTarget({
      DATABASE_URL: developmentUrl,
      TEST_DATABASE_URL: "postgresql://user:password@127.0.0.1:5433/make_my_marriage_test?schema=public",
    });

    assert.equal(target.databaseName, "make_my_marriage_test");
    assert.equal(target.isLocal, true);
  });

  it("rejects the development database even when query parameters differ", () => {
    assert.throws(
      () => getSafeTestDatabaseTarget({
        DATABASE_URL: developmentUrl,
        TEST_DATABASE_URL: "postgresql://user:password@127.0.0.1:5433/make_my_marriage?schema=test",
      }),
      /must not target the normal development database/,
    );
  });

  it("rejects database names without the test-only suffix", () => {
    assert.throws(
      () => getSafeTestDatabaseTarget({
        DATABASE_URL: developmentUrl,
        TEST_DATABASE_URL: "postgresql://user:password@127.0.0.1:5433/another_database",
      }),
      /must end with _test/,
    );
  });
});
