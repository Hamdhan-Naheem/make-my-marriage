import type { CreateWeddingRequest, UpdateWeddingRequest, WeddingWorkspace } from "@make-my-marriage/shared";
import { WeddingNotFoundError } from "../../shared/errors.js";
import type { WeddingRecord, WeddingRepository } from "./wedding.repository.js";

function parseDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function formatDateOnly(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function toWorkspace(record: WeddingRecord): WeddingWorkspace {
  return {
    id: record.id,
    name: record.name,
    brideName: record.brideName,
    groomName: record.groomName,
    managementType: record.managementType,
    mainWeddingDate: formatDateOnly(record.mainWeddingDate),
    member: record.member,
  };
}

export class WeddingService {
  constructor(private readonly repository: WeddingRepository) {}

  async create(userId: string, input: CreateWeddingRequest): Promise<WeddingWorkspace> {
    return toWorkspace(await this.repository.createWithOwner({
      userId,
      name: input.name,
      brideName: input.brideName,
      groomName: input.groomName,
      managementType: input.managementType,
      mainWeddingDate: parseDateOnly(input.mainWeddingDate),
      creatorSide: input.creatorSide,
    }));
  }

  async list(userId: string): Promise<WeddingWorkspace[]> {
    return (await this.repository.listForActiveMember(userId)).map(toWorkspace);
  }

  async getForActiveMember(weddingId: string, userId: string): Promise<WeddingWorkspace> {
    const wedding = await this.repository.findForActiveMember(weddingId, userId);
    if (!wedding) throw new WeddingNotFoundError();
    return toWorkspace(wedding);
  }

  async updateForOwner(weddingId: string, userId: string, input: UpdateWeddingRequest): Promise<WeddingWorkspace> {
    const wedding = await this.repository.updateForActiveOwner(weddingId, userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.brideName !== undefined ? { brideName: input.brideName } : {}),
      ...(input.groomName !== undefined ? { groomName: input.groomName } : {}),
      ...(input.mainWeddingDate !== undefined ? { mainWeddingDate: parseDateOnly(input.mainWeddingDate) } : {}),
    });
    if (!wedding) throw new WeddingNotFoundError();
    return toWorkspace(wedding);
  }
}
