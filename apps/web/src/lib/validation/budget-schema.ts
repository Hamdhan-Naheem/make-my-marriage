import { z } from "zod";
import { moneyAmountSchema } from "@make-my-marriage/shared";

export const budgetSettingsSchema = z.object({
  currency: z.enum(["LKR", "USD", "AUD", "SGD"], { error: "Choose a currency." }),
  budgetAmount: z.string().refine((value) => value === "" || moneyAmountSchema.safeParse(value).success, "Use a non-negative amount with up to 2 decimal places."),
}).strict();

export type BudgetSettingsValues = z.infer<typeof budgetSettingsSchema>;
