import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(320, "Use 320 characters or fewer.")
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128, "Use 128 characters or fewer."),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name.").max(100, "Use 100 characters or fewer."),
    lastName: z.string().trim().min(1, "Enter your last name.").max(100, "Use 100 characters or fewer."),
    email: emailSchema,
    password: z.string().min(12, "Use at least 12 characters.").max(128, "Use 128 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resendVerificationSchema = z.object({ email: emailSchema });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;
