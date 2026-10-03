import type {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  WeddingExpense,
  WeddingManagementType,
} from "@make-my-marriage/shared";
import { Prisma } from "../../generated/prisma/client.js";
import { ExpenseNotFoundError } from "../../shared/errors.js";
import type {
  ExpenseListFilters,
  ExpenseRecord,
  ExpenseRepository,
  ExpenseWriteRecord,
} from "./expense.repository.js";
import { validateExpenseSide } from "./expense.rules.js";

function parseDateOnly(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toExpense(record: ExpenseRecord): WeddingExpense {
  return {
    ...record,
    amount: record.amount.toFixed(2),
    expenseDate: record.expenseDate?.toISOString().slice(0, 10) ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toWriteRecord(weddingId: string, value: {
  eventId?: string | null;
  name: string;
  description?: string | null;
  amount: string;
  side: ExpenseWriteRecord["side"];
  expenseDate?: string | null;
  category?: string | null;
}): ExpenseWriteRecord {
  return {
    weddingId,
    eventId: value.eventId ?? null,
    name: value.name,
    description: value.description || null,
    amount: new Prisma.Decimal(value.amount),
    side: value.side,
    expenseDate: parseDateOnly(value.expenseDate),
    category: value.category || null,
  };
}

export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  async create(
    weddingId: string,
    managementType: WeddingManagementType,
    userId: string,
    input: CreateExpenseRequest,
  ): Promise<WeddingExpense> {
    validateExpenseSide(input.side, managementType);
    return toExpense(await this.repository.create(
      { ...toWriteRecord(weddingId, input), createdByUserId: userId },
      managementType,
    ));
  }

  async list(weddingId: string, filters: ExpenseListFilters) {
    const result = await this.repository.list(weddingId, filters);
    return {
      data: result.records.map(toExpense),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    };
  }

  async get(weddingId: string, expenseId: string): Promise<WeddingExpense> {
    const expense = await this.repository.find(weddingId, expenseId);
    if (!expense) throw new ExpenseNotFoundError();
    return toExpense(expense);
  }

  async update(
    weddingId: string,
    expenseId: string,
    managementType: WeddingManagementType,
    input: UpdateExpenseRequest,
  ): Promise<WeddingExpense> {
    const current = await this.repository.find(weddingId, expenseId);
    if (!current) throw new ExpenseNotFoundError();
    const currentExpense = toExpense(current);
    const merged = {
      eventId: input.eventId === undefined ? currentExpense.eventId : input.eventId,
      name: input.name ?? currentExpense.name,
      description: input.description === undefined ? currentExpense.description : input.description,
      amount: input.amount ?? currentExpense.amount,
      side: input.side ?? currentExpense.side,
      expenseDate: input.expenseDate === undefined ? currentExpense.expenseDate : input.expenseDate,
      category: input.category === undefined ? currentExpense.category : input.category,
    };
    validateExpenseSide(merged.side, managementType);
    return toExpense(await this.repository.update(
      weddingId,
      expenseId,
      toWriteRecord(weddingId, merged),
      managementType,
    ));
  }

  async delete(weddingId: string, expenseId: string): Promise<void> {
    await this.repository.delete(weddingId, expenseId);
  }
}
