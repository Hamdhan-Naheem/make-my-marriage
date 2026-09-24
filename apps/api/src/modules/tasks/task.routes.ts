import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { requireTrustedOrigin } from "../auth/csrf.js";
import { loadActiveWeddingMembership } from "../weddings/wedding.middleware.js";
import { createTaskController, deleteTaskController, getTaskController, listTasksController, updateTaskController } from "./task.controller.js";
import { requireTaskOwner } from "./task.middleware.js";

export const taskRouter = Router({ mergeParams: true });

taskRouter.use(requireAuthentication, loadActiveWeddingMembership, requireTaskOwner);
taskRouter.get("/", listTasksController);
taskRouter.post("/", requireTrustedOrigin, createTaskController);
taskRouter.get("/:taskId", getTaskController);
taskRouter.patch("/:taskId", requireTrustedOrigin, updateTaskController);
taskRouter.delete("/:taskId", requireTrustedOrigin, deleteTaskController);
