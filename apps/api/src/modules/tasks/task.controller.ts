import type { RequestHandler } from "express";
import type { SafeUser } from "../auth/auth.service.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";
import { taskService } from "./task.dependencies.js";
import { parseCreateTaskRequest, parseTaskId, parseTaskListFilters, parseUpdateTaskRequest } from "./task.schema.js";

export const createTaskController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const user = res.locals["authUser"] as SafeUser;
    const task = await taskService.create(wedding.id, wedding.managementType, user.id, parseCreateTaskRequest(req.body));
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const listTasksController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const result = await taskService.list(wedding.id, parseTaskListFilters(req.query));
    res.status(200).json({ success: true, data: result.tasks, meta: result.meta });
  } catch (error) { next(error); }
};

export const getTaskController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    res.status(200).json({ success: true, data: await taskService.get(wedding.id, parseTaskId(req.params)) });
  } catch (error) { next(error); }
};

export const updateTaskController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const task = await taskService.update(wedding.id, parseTaskId(req.params), wedding.managementType, parseUpdateTaskRequest(req.body));
    res.status(200).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const deleteTaskController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    await taskService.delete(wedding.id, parseTaskId(req.params));
    res.status(204).send();
  } catch (error) { next(error); }
};
