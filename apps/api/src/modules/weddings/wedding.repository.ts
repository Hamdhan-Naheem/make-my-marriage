import type {
  WeddingCurrency,
  WeddingManagementType,
  WeddingMemberRole,
  WeddingSide,
} from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  CurrencyChangeLockedError,
  FinancialCurrencyRequiredError,
  OverallBudgetBelowEventAllocationsError,
} from "../../shared/errors.js";

export type WeddingRecord = {
  id: string;
  name: string;
  brideName: string;
  groomName: string;
  managementType: WeddingManagementType;
  mainWeddingDate: Date | null;
  budgetAmount: Prisma.Decimal | null;
  currency: WeddingCurrency | null;
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
  budgetAmount?: Prisma.Decimal | null;
  currency?: WeddingCurrency;
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
  budgetAmount: true,
  currency: true,
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
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT "id" FROM "weddings" WHERE "id" = ${weddingId}::uuid FOR UPDATE`;
      const current = await transaction.wedding.findFirst({
        where: {
          id: weddingId,
          archivedAt: null,
          members: { some: { userId, isActive: true, role: "OWNER" } },
        },
        select: {
          ...weddingSelection,
          members: {
            where: { userId, isActive: true, role: "OWNER" },
            select: { role: true, side: true },
            take: 1,
          },
        },
      });
      if (!current || !current.members[0]) return null;

      if (input.currency !== undefined || input.budgetAmount !== undefined) {
        const [eventBudgetCount, expenseCount] = await Promise.all([
          transaction.event.count({ where: { weddingId, budgetAmount: { not: null } } }),
          transaction.expense.count({ where: { weddingId } }),
        ]);
        const currencyChanges = input.currency !== undefined && input.currency !== current.currency;
        if (currencyChanges && (current.budgetAmount !== null || eventBudgetCount > 0 || expenseCount > 0)) {
          throw new CurrencyChangeLockedError();
        }

        const resultingCurrency = input.currency ?? current.currency;
        if (input.budgetAmount !== undefined && input.budgetAmount !== null && !resultingCurrency) {
          throw new FinancialCurrencyRequiredError();
        }

        if (input.budgetAmount !== undefined && input.budgetAmount !== null) {
          const allocated = (await transaction.event.aggregate({
            where: { weddingId },
            _sum: { budgetAmount: true },
          }))._sum.budgetAmount ?? new Prisma.Decimal(0);
          if (allocated.greaterThan(input.budgetAmount)) {
            throw new OverallBudgetBelowEventAllocationsError();
          }
        }
      }

      const { members, ...currentWedding } = current;
      const wedding = await transaction.wedding.update({
        where: { id: weddingId },
        data: input,
        select: weddingSelection,
      });
      return { ...currentWedding, ...wedding, member: members[0]! };
    });
  }
}
