"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validation/auth-schemas";
import { AuthFormStatus } from "./auth-form-status";
import { AuthTextField } from "./auth-text-field";

export function ForgotPasswordForm() {
  const [statusMessage, setStatusMessage] = useState<string>();
  const { handleSubmit, register, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function handleValidSubmission() {
    setStatusMessage("Password recovery is not connected yet. No reset email was sent.");
  }

  return (
    <form className="mt-6" noValidate onSubmit={handleSubmit(handleValidSubmission)}>
      <AuthTextField autoCapitalize="none" autoComplete="email" error={errors.email?.message} icon="email" id="forgot-password-email" inputMode="email" label="Email address" placeholder="Enter your email address" registration={register("email")} spellCheck={false} type="email" />
      <button className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" type="submit">Send reset link</button>
      <AuthFormStatus message={statusMessage} />
      <p className="mt-6 text-center text-sm text-[#554243]"><Link className="rounded-md font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4 transition hover:text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/login">Back to login</Link></p>
    </form>
  );
}
