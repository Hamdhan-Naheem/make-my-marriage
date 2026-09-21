import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";

const nameSchema = z.string().trim().min(1, "This field is required.").max(100, "Use 100 characters or fewer.");

export const registerRequestSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .max(320, "Use 320 characters or fewer.")
      .email("Enter a valid email address.")
      .transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use 128 characters or fewer."),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address.")
      .max(320, "Use 320 characters or fewer.")
      .email("Enter a valid email address.")
      .transform((email) => email.toLowerCase()),
    password: z.string().min(1, "Enter your password.").max(128, "Use 128 characters or fewer."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginRequestSchema>;

export function parseRegisterRequest(body: unknown): RegisterInput {
  return parseRequest(registerRequestSchema, body);
}

export function parseLoginRequest(body: unknown): LoginInput {
  return parseRequest(loginRequestSchema, body);
}

function parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const fields: ValidationFields = {};

  for (const issue of result.error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "_form";
    const message = issue.code === "unrecognized_keys" ? "Request contains unsupported fields." : issue.message;
    fields[field] = [...(fields[field] ?? []), message];
  }

  throw new RequestValidationError(fields);
}
