import {
  createExpenseRequestSchema,
  updateExpenseRequestSchema,
  weddingSideSchema,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
  type WeddingSide,
} from "@make-my-marriage/shared";
import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";
import type { ExpenseListFilters } from "./expense.repository.js";

const expenseParamsSchema = z.object({
  weddingId: z.string().uuid("Wedding ID must be a valid UUID."),
  expenseId: z.string().uuid("Expense ID must be a valid UUID."),
}).strict();

const expenseListQuerySchema = z.object({
  eventId: z.union([z.literal("none"), z.string().uuid("Event ID must be a valid UUID.")]).optional(),
  side: weddingSideSchema.optional(),
  category: z.string().trim().min(1, "Category cannot be empty.").max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

function parseWithValidation<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: ValidationFields = {};
  for (const issue of result.error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "_form";
    const message = issue.code === "unrecognized_keys" ? "Request contains unsupported fields." : issue.message;
    fields[field] = [...(fields[field] ?? []), message];
  }
  throw new RequestValidationError(fields);
}

export function parseCreateExpenseRequest(body: unknown): CreateExpenseRequest {
  return parseWithValidation(createExpenseRequestSchema, body);
}

export function parseUpdateExpenseRequest(body: unknown): UpdateExpenseRequest {
  return parseWithValidation(updateExpenseRequestSchema, body);
}

export function parseExpenseId(params: unknown): string {
  return parseWithValidation(expenseParamsSchema, params).expenseId;
}

export function parseExpenseListFilters(query: unknown): ExpenseListFilters {
  const parsed: {
    eventId?: string;
    side?: WeddingSide;
    category?: string;
    page: number;
    limit: number;
  } = parseWithValidation(expenseListQuerySchema, query);
  return {
    ...parsed,
    ...(parsed.eventId !== undefined ? { eventId: parsed.eventId === "none" ? null : parsed.eventId } : {}),
  };
}
