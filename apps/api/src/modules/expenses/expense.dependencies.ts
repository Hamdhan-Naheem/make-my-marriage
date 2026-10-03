import { PrismaExpenseRepository } from "./expense.repository.js";
import { ExpenseService } from "./expense.service.js";

export const expenseService = new ExpenseService(new PrismaExpenseRepository());
