"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, resendVerification } from "@/lib/api";
import { resendVerificationSchema, type ResendVerificationFormValues } from "@/lib/validation/auth-schemas";
import { AuthFormStatus } from "./auth-form-status";
import { AuthTextField } from "./auth-text-field";

export function ResendVerificationForm() {
  const [status, setStatus] = useState<{ message: string; tone: "error" | "success" }>();
  const { handleSubmit, register, setError, formState: { errors, isSubmitting } } = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function handleValidSubmission(values: ResendVerificationFormValues) {
    setStatus(undefined);
    try {
      const message = await resendVerification(values.email);
      setStatus({ tone: "success", message });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields?.email?.[0]) setError("email", { type: "server", message: error.fields.email[0] });
        setStatus({ tone: "error", message: error.message });
        return;
      }
      setStatus({ tone: "error", message: "A verification email cannot be requested right now. Please try again." });
    }
  }

  return (
    <form className="mt-6" noValidate onSubmit={handleSubmit(handleValidSubmission)}>
      <AuthTextField autoCapitalize="none" autoComplete="email" error={errors.email?.message} icon="email" id="resend-verification-email" inputMode="email" label="Email address" placeholder="Enter your email address" registration={register("email")} spellCheck={false} type="email" />
      <button aria-busy={isSubmitting} className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 disabled:cursor-not-allowed disabled:opacity-65" disabled={isSubmitting} type="submit">{isSubmitting ? "Requesting link…" : "Request verification link"}</button>
      <AuthFormStatus message={status?.message} tone={status?.tone} />
      <p className="mt-6 text-center text-sm text-[#554243]"><Link className="rounded-md font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4" href="/login">Back to login</Link></p>
    </form>
  );
}
