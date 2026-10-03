import type { BudgetSummary } from "@make-my-marriage/shared";
import { Prisma } from "../../generated/prisma/client.js";
import { FinancialCurrencyRequiredError } from "../../shared/errors.js";
import type { BudgetRepository } from "./budget.repository.js";

function position(budgetAmount: Prisma.Decimal | null, spentAmount: Prisma.Decimal) {
  if (budgetAmount === null) {
    return {
      budgetAmount: null,
      spentAmount: spentAmount.toFixed(2),
      remainingAmount: null,
      isOverBudget: null,
      overByAmount: null,
    };
  }
  const remaining = budgetAmount.minus(spentAmount);
  const isOverBudget = remaining.isNegative();
  return {
    budgetAmount: budgetAmount.toFixed(2),
    spentAmount: spentAmount.toFixed(2),
    remainingAmount: remaining.toFixed(2),
    isOverBudget,
    overByAmount: isOverBudget ? remaining.abs().toFixed(2) : "0.00",
  };
}

export class BudgetService {
  constructor(private readonly repository: BudgetRepository) {}

  async summarize(weddingId: string): Promise<BudgetSummary> {
    const record = await this.repository.summarize(weddingId);
    if (!record.currency) throw new FinancialCurrencyRequiredError();
    const overall = position(record.budgetAmount, record.spentAmount);
    return {
      currency: record.currency,
      overall: {
        ...overall,
        allocatedEventBudgetAmount: record.allocatedEventBudgetAmount.toFixed(2),
        unallocatedBudgetAmount: record.budgetAmount
          ? record.budgetAmount.minus(record.allocatedEventBudgetAmount).toFixed(2)
          : null,
        weddingWideSpentAmount: record.weddingWideSpentAmount.toFixed(2),
      },
      events: record.events.map((event) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        ...position(event.budgetAmount, event.spentAmount),
      })),
    };
  }
}
