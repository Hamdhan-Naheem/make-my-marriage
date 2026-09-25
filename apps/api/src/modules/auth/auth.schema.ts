import { z } from "zod";
import { RequestValidationError, type ValidationFields } from "../../shared/errors.js";

const nameSchema = z.string().trim().min(1, "This field is required.").max(100, "Use 100 characters or fewer.");
const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(320, "Use 320 characters or fewer.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const registerRequestSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use 128 characters or fewer."),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Enter your password.").max(128, "Use 128 characters or fewer."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginRequestSchema>;

export const verifyEmailRequestSchema = z.object({
  token: z
    .string()
    .length(43, "The verification token is invalid.")
    .regex(/^[A-Za-z0-9_-]+$/, "The verification token is invalid."),
}).strict();

export const resendVerificationRequestSchema = z.object({ email: emailSchema }).strict();

export function parseRegisterRequest(body: unknown): RegisterInput {
  return parseRequest(registerRequestSchema, body);
}

export function parseLoginRequest(body: unknown): LoginInput {
  return parseRequest(loginRequestSchema, body);
}

export function parseVerifyEmailRequest(body: unknown) {
  return parseRequest(verifyEmailRequestSchema, body);
}

export function parseResendVerificationRequest(body: unknown) {
  return parseRequest(resendVerificationRequestSchema, body);
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
