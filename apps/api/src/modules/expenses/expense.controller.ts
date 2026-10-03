import type { RequestHandler } from "express";
import type { SafeUser } from "../auth/auth.service.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";
import { expenseService } from "./expense.dependencies.js";
import {
  parseCreateExpenseRequest,
  parseExpenseId,
  parseExpenseListFilters,
  parseUpdateExpenseRequest,
} from "./expense.schema.js";

export const createExpenseController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const user = res.locals["authUser"] as SafeUser;
    const expense = await expenseService.create(
      wedding.id,
      wedding.managementType,
      user.id,
      parseCreateExpenseRequest(req.body),
    );
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const listExpensesController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const result = await expenseService.list(wedding.id, parseExpenseListFilters(req.query));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getExpenseController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    res.status(200).json({ success: true, data: await expenseService.get(wedding.id, parseExpenseId(req.params)) });
  } catch (error) {
    next(error);
  }
};

export const updateExpenseController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const expense = await expenseService.update(
      wedding.id,
      parseExpenseId(req.params),
      wedding.managementType,
      parseUpdateExpenseRequest(req.body),
    );
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const deleteExpenseController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    await expenseService.delete(wedding.id, parseExpenseId(req.params));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
