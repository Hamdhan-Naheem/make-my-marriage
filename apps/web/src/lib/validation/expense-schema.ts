import { z } from "zod";
import { dateOnlySchema, positiveMoneyAmountSchema, type CreateExpenseRequest, type WeddingExpense, type WeddingManagementType, type WeddingSide } from "@make-my-marriage/shared";

export const expenseFormSchema = z.object({
  name: z.string().trim().min(1, "Enter an expense name.").max(140, "Use 140 characters or fewer."),
  description: z.string().trim().max(1000, "Use 1,000 characters or fewer."),
  amount: positiveMoneyAmountSchema,
  side: z.enum(["BRIDE", "GROOM", "BOTH"], { error: "Choose an Expense Side." }),
  expenseDate: z.string().refine((value) => value === "" || dateOnlySchema.safeParse(value).success, "Enter a valid expense date."),
  category: z.string().trim().max(100, "Use 100 characters or fewer."),
  eventId: z.string().refine((value) => value === "" || z.string().uuid().safeParse(value).success, "Choose a valid Event."),
}).strict();

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function weddingExpenseSide(managementType: WeddingManagementType): WeddingSide | undefined {
  return managementType === "BRIDE_SIDE" ? "BRIDE" : managementType === "GROOM_SIDE" ? "GROOM" : undefined;
}

export function allowedExpenseSides(managementType: WeddingManagementType, eventSide?: WeddingSide): WeddingSide[] {
  const weddingSide = weddingExpenseSide(managementType);
  if (weddingSide) return [weddingSide];
  if (eventSide === "BRIDE" || eventSide === "GROOM") return [eventSide];
  return ["BRIDE", "GROOM", "BOTH"];
}

export function toExpenseRequest(values: ExpenseFormValues): CreateExpenseRequest {
  return {
    name: values.name,
    description: values.description || null,
    amount: values.amount,
    side: values.side,
    expenseDate: values.expenseDate || null,
    category: values.category || null,
    eventId: values.eventId || null,
  };
}

export function expenseToFormValues(expense: WeddingExpense): ExpenseFormValues {
  return {
    name: expense.name,
    description: expense.description ?? "",
    amount: expense.amount,
    side: expense.side,
    expenseDate: expense.expenseDate ?? "",
    category: expense.category ?? "",
    eventId: expense.eventId ?? "",
  };
}
