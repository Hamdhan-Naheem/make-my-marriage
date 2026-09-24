import {
  createTaskRequestSchema,
  taskStatusSchema,
  updateTaskRequestSchema,
  weddingSideSchema,
  type CreateTaskRequest,
  type TaskStatus,
  type UpdateTaskRequest,
  type WeddingSide,
} from "@make-my-marriage/shared";
import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";
import type { TaskListFilters } from "./task.repository.js";

const taskParamsSchema = z.object({
  weddingId: z.string().uuid("Wedding ID must be a valid UUID."),
  taskId: z.string().uuid("Task ID must be a valid UUID."),
}).strict();

const taskListQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  side: weddingSideSchema.optional(),
  eventId: z.string().uuid("Event ID must be a valid UUID.").optional(),
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

export function parseCreateTaskRequest(body: unknown): CreateTaskRequest {
  return parseWithValidation(createTaskRequestSchema, body);
}

export function parseUpdateTaskRequest(body: unknown): UpdateTaskRequest {
  return parseWithValidation(updateTaskRequestSchema, body);
}

export function parseTaskId(params: unknown): string {
  return parseWithValidation(taskParamsSchema, params).taskId;
}

export function parseTaskListFilters(query: unknown): TaskListFilters {
  const result: { status?: TaskStatus; side?: WeddingSide; eventId?: string; page: number; limit: number } = parseWithValidation(taskListQuerySchema, query);
  return result;
}
