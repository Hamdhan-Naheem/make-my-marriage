import {
  createEventRequestSchema,
  updateEventRequestSchema,
  weddingSideSchema,
  type CreateEventRequest,
  type UpdateEventRequest,
  type WeddingSide,
} from "@make-my-marriage/shared";
import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";

const eventParamsSchema = z.object({
  weddingId: z.string().uuid("Wedding ID must be a valid UUID."),
  eventId: z.string().uuid("Event ID must be a valid UUID."),
}).strict();

const eventListQuerySchema = z.object({ side: weddingSideSchema.optional() }).strict();

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

export function parseCreateEventRequest(body: unknown): CreateEventRequest {
  return parseWithValidation(createEventRequestSchema, body);
}

export function parseUpdateEventRequest(body: unknown): UpdateEventRequest {
  return parseWithValidation(updateEventRequestSchema, body);
}

export function parseEventId(params: unknown): string {
  return parseWithValidation(eventParamsSchema, params).eventId;
}

export function parseEventListSide(query: unknown): WeddingSide | undefined {
  return parseWithValidation(eventListQuerySchema, query).side;
}
