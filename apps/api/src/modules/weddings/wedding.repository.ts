import type { WeddingManagementType, WeddingMemberRole, WeddingSide } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";

export type WeddingRecord = {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  managementType: WeddingManagementType;
  mainWeddingDate: Date | null;
  member: { role: WeddingMemberRole; side: WeddingSide };
};

export type CreateWeddingRecord = {
  userId: string;
  name: string;
  brideName: string;
  groomName: string;
  managementType: WeddingManagementType;
  mainWeddingDate: Date | null;
  creatorSide: WeddingSide;
};

export type UpdateWeddingRecord = {
  name?: string;
  brideName?: string;
  groomName?: string;
  mainWeddingDate?: Date | null;
};

export interface WeddingRepository {
  createWithOwner(input: CreateWeddingRecord): Promise<WeddingRecord>;
  listForActiveMember(userId: string): Promise<WeddingRecord[]>;
  findForActiveMember(weddingId: string, userId: string): Promise<WeddingRecord | null>;
  updateForActiveOwner(weddingId: string, userId: string, input: UpdateWeddingRecord): Promise<WeddingRecord | null>;
}

const weddingSelection = {
  id: true,
  name: true,
  brideName: true,
  groomName: true,
  managementType: true,
  mainWeddingDate: true,
} as const;

export class PrismaWeddingRepository implements WeddingRepository {
  async createWithOwner(input: CreateWeddingRecord): Promise<WeddingRecord> {
    return prisma.$transaction(async (transaction) => {
      const wedding = await transaction.wedding.create({
        data: {
          name: input.name,
          brideName: input.brideName,
          groomName: input.groomName,
          managementType: input.managementType,
          mainWeddingDate: input.mainWeddingDate,
          createdByUserId: input.userId,
        },
        select: weddingSelection,
      });
      const member = await transaction.weddingMember.create({
        data: {
          weddingId: wedding.id,
          userId: input.userId,
          role: "OWNER",
          side: input.creatorSide,
          isActive: true,
        },
        select: { role: true, side: true },
      });
      return { ...wedding, member };
    });
  }

  async listForActiveMember(userId: string): Promise<WeddingRecord[]> {
    const weddings = await prisma.wedding.findMany({
      where: {
        archivedAt: null,
        members: { some: { userId, isActive: true } },
      },
      orderBy: { createdAt: "asc" },
      select: {
        ...weddingSelection,
        members: {
          where: { userId, isActive: true },
          select: { role: true, side: true },
          take: 1,
        },
      },
    });

    return weddings.map(({ members, ...wedding }) => ({ ...wedding, member: members[0]! }));
  }

  async findForActiveMember(weddingId: string, userId: string): Promise<WeddingRecord | null> {
    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        archivedAt: null,
        members: { some: { userId, isActive: true } },
      },
      select: {
        ...weddingSelection,
        members: {
          where: { userId, isActive: true },
          select: { role: true, side: true },
          take: 1,
        },
      },
    });
    if (!wedding || !wedding.members[0]) return null;
    const { members, ...workspace } = wedding;
    return { ...workspace, member: members[0] };
  }

  async updateForActiveOwner(weddingId: string, userId: string, input: UpdateWeddingRecord): Promise<WeddingRecord | null> {
    const result = await prisma.wedding.updateMany({
      where: { id: weddingId, archivedAt: null, members: { some: { userId, isActive: true, role: "OWNER" } } },
      data: input,
    });
    if (result.count !== 1) return null;
    return this.findForActiveMember(weddingId, userId);
  }
}
