import type { WeddingSide } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  EventBudgetAllocationExceededError,
  EventSideExpenseConflictError,
  EventSideTaskConflictError,
  FinancialCurrencyRequiredError,
} from "../../shared/errors.js";

export type EventRecord = {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  side: WeddingSide;
  eventDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  venueName: string | null;
  address: string | null;
  budgetAmount: Prisma.Decimal | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventWriteRecord = Omit<EventRecord, "id" | "createdAt" | "updatedAt">;

export type EventDraftTaskWriteRecord = {
  name: string;
  description: string | null;
  side: WeddingSide;
  dueDate: Date | null;
};

export interface EventRepository {
  create(input: EventWriteRecord & { createdByUserId: string }, tasks?: EventDraftTaskWriteRecord[]): Promise<EventRecord>;
  list(weddingId: string, side?: WeddingSide): Promise<EventRecord[]>;
  find(weddingId: string, eventId: string): Promise<EventRecord | null>;
  update(weddingId: string, eventId: string, input: EventWriteRecord): Promise<EventRecord>;
}

const eventSelection = {
  id: true,
  weddingId: true,
  name: true,
  description: true,
  side: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  venueName: true,
  address: true,
  budgetAmount: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function lockWedding(transaction: Prisma.TransactionClient, weddingId: string) {
  await transaction.$queryRaw`SELECT "id" FROM "weddings" WHERE "id" = ${weddingId}::uuid FOR UPDATE`;
  return transaction.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    select: { currency: true, budgetAmount: true },
  });
}

async function validateAllocation(
  transaction: Prisma.TransactionClient,
  weddingId: string,
  budgetAmount: Prisma.Decimal | null,
  excludedEventId?: string,
) {
  if (budgetAmount === null) return;
  const wedding = await transaction.wedding.findUniqueOrThrow({
    where: { id: weddingId },
    select: { currency: true, budgetAmount: true },
  });
  if (!wedding.currency) throw new FinancialCurrencyRequiredError();
  if (wedding.budgetAmount === null) return;
  const allocated = (await transaction.event.aggregate({
    where: { weddingId, ...(excludedEventId ? { id: { not: excludedEventId } } : {}) },
    _sum: { budgetAmount: true },
  }))._sum.budgetAmount ?? new Prisma.Decimal(0);
  if (allocated.plus(budgetAmount).greaterThan(wedding.budgetAmount)) {
    throw new EventBudgetAllocationExceededError();
  }
}

export class PrismaEventRepository implements EventRepository {
  async create(input: EventWriteRecord & { createdByUserId: string }, tasks: EventDraftTaskWriteRecord[] = []): Promise<EventRecord> {
    return prisma.$transaction(async (transaction) => {
      if (input.budgetAmount !== null) {
        await lockWedding(transaction, input.weddingId);
        await validateAllocation(transaction, input.weddingId, input.budgetAmount);
      }
      const event = await transaction.event.create({ data: input, select: eventSelection });
      if (tasks.length > 0) {
        await transaction.task.createMany({
          data: tasks.map((task) => ({
            ...task,
            weddingId: input.weddingId,
            eventId: event.id,
            createdByUserId: input.createdByUserId,
          })),
        });
      }
      return event;
    });
  }

  async list(weddingId: string, side?: WeddingSide): Promise<EventRecord[]> {
    return prisma.event.findMany({
      where: { weddingId, ...(side ? { side } : {}) },
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
      select: eventSelection,
    });
  }

  async find(weddingId: string, eventId: string): Promise<EventRecord | null> {
    return prisma.event.findUnique({ where: { weddingId_id: { weddingId, id: eventId } }, select: eventSelection });
  }

  async update(weddingId: string, eventId: string, input: EventWriteRecord): Promise<EventRecord> {
    return prisma.$transaction(async (transaction) => {
      await lockWedding(transaction, weddingId);
      await validateAllocation(transaction, weddingId, input.budgetAmount, eventId);

      if (input.side !== "BOTH") {
        const [incompatibleTasks, incompatibleExpenses] = await Promise.all([
          transaction.task.count({ where: { weddingId, eventId, side: { not: input.side } } }),
          transaction.expense.count({ where: { weddingId, eventId, side: { not: input.side } } }),
        ]);
        if (incompatibleTasks > 0) throw new EventSideTaskConflictError();
        if (incompatibleExpenses > 0) throw new EventSideExpenseConflictError();
      }

      return transaction.event.update({
        where: { weddingId_id: { weddingId, id: eventId } },
        data: input,
        select: eventSelection,
      });
    });
  }
}
