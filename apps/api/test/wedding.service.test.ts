import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CreateWeddingRequest } from "@make-my-marriage/shared";
import type { CreateWeddingRecord, UpdateWeddingRecord, WeddingRecord, WeddingRepository } from "../src/modules/weddings/wedding.repository.js";
import { WeddingService } from "../src/modules/weddings/wedding.service.js";
import { WeddingNotFoundError } from "../src/shared/errors.js";

const record: WeddingRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ahamed & Fathima Wedding",
  brideName: "Fathima",
  groomName: "Ahamed",
  managementType: "JOINT",
  mainWeddingDate: new Date("2027-01-20T00:00:00.000Z"),
  member: { role: "OWNER", side: "GROOM" },
};

class FakeWeddingRepository implements WeddingRepository {
  created?: CreateWeddingRecord;
  listed: WeddingRecord[] = [record];
  found: WeddingRecord | null = record;
  updated?: UpdateWeddingRecord;
  async createWithOwner(input: CreateWeddingRecord) { this.created = input; return record; }
  async listForActiveMember() { return this.listed; }
  async findForActiveMember() { return this.found; }
  async updateForActiveOwner(_weddingId: string, _userId: string, input: UpdateWeddingRecord) { this.updated = input; return { ...record, ...input }; }
}

const input: CreateWeddingRequest = {
  name: record.name,
  brideName: record.brideName,
  groomName: record.groomName,
  managementType: "JOINT",
  mainWeddingDate: "2027-01-20",
  creatorSide: "GROOM",
};

describe("WeddingService", () => {
  it("passes the creator and date to one repository creation operation", async () => {
    const repository = new FakeWeddingRepository();
    const result = await new WeddingService(repository).create("user-id", input);
    assert.equal(repository.created?.userId, "user-id");
    assert.equal(repository.created?.mainWeddingDate?.toISOString(), "2027-01-20T00:00:00.000Z");
    assert.deepEqual(result, { ...record, mainWeddingDate: "2027-01-20" });
  });

  it("serializes nullable dates consistently in list responses", async () => {
    const repository = new FakeWeddingRepository();
    repository.listed = [{ ...record, mainWeddingDate: null }];
    assert.equal((await new WeddingService(repository).list("user-id"))[0]?.mainWeddingDate, null);
  });

  it("does not reveal inaccessible wedding IDs", async () => {
    const repository = new FakeWeddingRepository();
    repository.found = null;
    await assert.rejects(
      new WeddingService(repository).getForActiveMember(record.id, "other-user"),
      WeddingNotFoundError,
    );
  });

  it("updates only approved settings and converts the optional date", async () => {
    const repository = new FakeWeddingRepository();
    const result = await new WeddingService(repository).updateForOwner(record.id, "owner-id", { name: "Updated Wedding", mainWeddingDate: null });
    assert.deepEqual(repository.updated, { name: "Updated Wedding", mainWeddingDate: null });
    assert.equal(result.name, "Updated Wedding");
    assert.equal(result.managementType, "JOINT");
  });
});
