import { PrismaBudgetRepository } from "./budget.repository.js";
import { BudgetService } from "./budget.service.js";

export const budgetService = new BudgetService(new PrismaBudgetRepository());
