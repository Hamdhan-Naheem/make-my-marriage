import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required.")
    .regex(/^postgres(?:ql)?:\/\//, "DATABASE_URL must be a PostgreSQL connection string."),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000").transform((value) => value.replace(/\/$/, "")),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters.")
    .refine((value) => !value.startsWith("replace-with-"), "JWT_ACCESS_SECRET must not use the example placeholder."),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters.")
    .refine((value) => !value.startsWith("replace-with-"), "JWT_REFRESH_SECRET must not use the example placeholder."),
  RESEND_API_KEY: z.string().trim().min(1, "RESEND_API_KEY is required."),
  AUTH_EMAIL_FROM: z.string().trim().min(1, "AUTH_EMAIL_FROM is required."),
}).superRefine((value, context) => {
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["JWT_REFRESH_SECRET"],
      message: "JWT access and refresh secrets must be different.",
    });
  }

});

export function parseEnv(source: NodeJS.ProcessEnv) {
  return envSchema.parse(source);
}

export const env = parseEnv(process.env);
