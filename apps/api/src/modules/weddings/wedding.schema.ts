import { createWeddingRequestSchema, updateWeddingRequestSchema, type CreateWeddingRequest, type UpdateWeddingRequest } from "@make-my-marriage/shared";
import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";

const weddingIdParamsSchema = z.object({ weddingId: z.string().uuid("Wedding ID must be a valid UUID.") }).strict();

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

export function parseCreateWeddingRequest(body: unknown): CreateWeddingRequest {
  return parseWithValidation(createWeddingRequestSchema, body);
}

export function parseWeddingId(params: unknown): string {
  return parseWithValidation(weddingIdParamsSchema, params).weddingId;
}

export function parseUpdateWeddingRequest(body: unknown): UpdateWeddingRequest {
  return parseWithValidation(updateWeddingRequestSchema, body);
}
