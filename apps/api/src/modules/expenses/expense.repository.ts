import type { WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import { EventNotFoundError, ExpenseNotFoundError, FinancialCurrencyRequiredError } from "../../shared/errors.js";
import { validateExpenseSide } from "./expense.rules.js";

export type ExpenseRecord = {
  id: string;
  weddingId: string;
  eventId: string | null;
  name: string;
  description: string | null;
  amount: Prisma.Decimal;
  side: WeddingSide;
  expenseDate: Date | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseWriteRecord = Omit<ExpenseRecord, "id" | "createdAt" | "updatedAt">;

export type ExpenseListFilters = {
  eventId?: string | null;
  side?: WeddingSide;
  category?: string;
  page: number;
  limit: number;
};

export type ExpenseListResult = {
  records: ExpenseRecord[];
  total: number;
};

export interface ExpenseRepository {
  create(input: ExpenseWriteRecord & { createdByUserId: string }, managementType: WeddingManagementType): Promise<ExpenseRecord>;
  list(weddingId: string, filters: ExpenseListFilters): Promise<ExpenseListResult>;
  find(weddingId: string, expenseId: string): Promise<ExpenseRecord | null>;
  update(weddingId: string, expenseId: string, input: ExpenseWriteRecord, managementType: WeddingManagementType): Promise<ExpenseRecord>;
  delete(weddingId: string, expenseId: string): Promise<void>;
}

const expenseSelection = {
  id: true,
  weddingId: true,
  eventId: true,
  name: true,
  description: true,
  amount: true,
  side: true,
  expenseDate: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function lockWeddingAndRequireCurrency(transaction: Prisma.TransactionClient, weddingId: string) {
  await transaction.$queryRaw`SELECT "id" FROM "weddings" WHERE "id" = ${weddingId}::uuid FOR UPDATE`;
  const wedding = await transaction.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    select: { currency: true },
  });
  if (!wedding.currency) throw new FinancialCurrencyRequiredError();
}

async function validateLinkedEvent(
  transaction: Prisma.TransactionClient,
  weddingId: string,
  eventId: string | null,
  side: WeddingSide,
  managementType: WeddingManagementType,
) {
  if (!eventId) {
    validateExpenseSide(side, managementType);
    return;
  }
  const event = await transaction.event.findUnique({
    where: { weddingId_id: { weddingId, id: eventId } },
    select: { side: true },
  });
  if (!event) throw new EventNotFoundError();
  validateExpenseSide(side, managementType, event.side);
}

export class PrismaExpenseRepository implements ExpenseRepository {
  async create(input: ExpenseWriteRecord & { createdByUserId: string }, managementType: WeddingManagementType): Promise<ExpenseRecord> {
    return prisma.$transaction(async (transaction) => {
      await lockWeddingAndRequireCurrency(transaction, input.weddingId);
      await validateLinkedEvent(transaction, input.weddingId, input.eventId, input.side, managementType);
      return transaction.expense.create({ data: input, select: expenseSelection });
    });
  }

  async list(weddingId: string, filters: ExpenseListFilters): Promise<ExpenseListResult> {
    const where: Prisma.ExpenseWhereInput = {
      weddingId,
      ...(filters.eventId !== undefined ? { eventId: filters.eventId } : {}),
      ...(filters.side ? { side: filters.side } : {}),
      ...(filters.category ? { category: { equals: filters.category, mode: "insensitive" } } : {}),
    };
    const [records, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        orderBy: [
          { expenseDate: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: expenseSelection,
      }),
      prisma.expense.count({ where }),
    ]);
    return { records, total };
  }

  async find(weddingId: string, expenseId: string): Promise<ExpenseRecord | null> {
    return prisma.expense.findUnique({
      where: { weddingId_id: { weddingId, id: expenseId } },
      select: expenseSelection,
    });
  }

  async update(
    weddingId: string,
    expenseId: string,
    input: ExpenseWriteRecord,
    managementType: WeddingManagementType,
  ): Promise<ExpenseRecord> {
    return prisma.$transaction(async (transaction) => {
      await lockWeddingAndRequireCurrency(transaction, weddingId);
      const exists = await transaction.expense.findUnique({
        where: { weddingId_id: { weddingId, id: expenseId } },
        select: { id: true },
      });
      if (!exists) throw new ExpenseNotFoundError();
      await validateLinkedEvent(transaction, weddingId, input.eventId, input.side, managementType);
      return transaction.expense.update({
        where: { weddingId_id: { weddingId, id: expenseId } },
        data: input,
        select: expenseSelection,
      });
    });
  }

  async delete(weddingId: string, expenseId: string): Promise<void> {
    const result = await prisma.expense.deleteMany({ where: { weddingId, id: expenseId } });
    if (result.count !== 1) throw new ExpenseNotFoundError();
  }
}
