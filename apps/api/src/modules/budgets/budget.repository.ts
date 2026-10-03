import type { WeddingCurrency } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";

export type BudgetSummaryRecord = {
  currency: WeddingCurrency | null;
  budgetAmount: Prisma.Decimal | null;
  allocatedEventBudgetAmount: Prisma.Decimal;
  spentAmount: Prisma.Decimal;
  weddingWideSpentAmount: Prisma.Decimal;
  events: Array<{
    eventId: string;
    eventName: string;
    budgetAmount: Prisma.Decimal | null;
    spentAmount: Prisma.Decimal;
  }>;
};

export interface BudgetRepository {
  summarize(weddingId: string): Promise<BudgetSummaryRecord>;
}

export class PrismaBudgetRepository implements BudgetRepository {
  async summarize(weddingId: string): Promise<BudgetSummaryRecord> {
    return prisma.$transaction(async (transaction) => {
      const [wedding, allocated, spent, weddingWideSpent, events, eventSpending] = await Promise.all([
        transaction.wedding.findUniqueOrThrow({
          where: { id: weddingId },
          select: { currency: true, budgetAmount: true },
        }),
        transaction.event.aggregate({ where: { weddingId }, _sum: { budgetAmount: true } }),
        transaction.expense.aggregate({ where: { weddingId }, _sum: { amount: true } }),
        transaction.expense.aggregate({ where: { weddingId, eventId: null }, _sum: { amount: true } }),
        transaction.event.findMany({
          where: { weddingId },
          orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
          select: { id: true, name: true, budgetAmount: true },
        }),
        transaction.expense.groupBy({
          by: ["eventId"],
          where: { weddingId, eventId: { not: null } },
          _sum: { amount: true },
        }),
      ]);
      const spendingByEvent = new Map(
        eventSpending.flatMap((item) => item.eventId ? [[item.eventId, item._sum.amount ?? new Prisma.Decimal(0)] as const] : []),
      );
      return {
        currency: wedding.currency,
        budgetAmount: wedding.budgetAmount,
        allocatedEventBudgetAmount: allocated._sum.budgetAmount ?? new Prisma.Decimal(0),
        spentAmount: spent._sum.amount ?? new Prisma.Decimal(0),
        weddingWideSpentAmount: weddingWideSpent._sum.amount ?? new Prisma.Decimal(0),
        events: events.map((event) => ({
          eventId: event.id,
          eventName: event.name,
          budgetAmount: event.budgetAmount,
          spentAmount: spendingByEvent.get(event.id) ?? new Prisma.Decimal(0),
        })),
      };
    });
  }
}
