"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth-schemas";
import { AuthFormStatus } from "./auth-form-status";
import { AuthTextField } from "./auth-text-field";
import { PasswordField } from "./password-field";

export function RegisterForm() {
  const [statusMessage, setStatusMessage] = useState<string>();
  const { handleSubmit, register, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function handleValidSubmission() {
    setStatusMessage("Registration is not connected yet. No account was created or verification email sent.");
  }

  return (
    <form className="mt-6" noValidate onSubmit={handleSubmit(handleValidSubmission)}>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthTextField autoComplete="given-name" error={errors.firstName?.message} icon="person" id="register-first-name" label="First name" placeholder="Enter your first name" registration={register("firstName")} />
          <AuthTextField autoComplete="family-name" error={errors.lastName?.message} icon="person" id="register-last-name" label="Last name" placeholder="Enter your last name" registration={register("lastName")} />
        </div>
        <AuthTextField autoCapitalize="none" autoComplete="email" error={errors.email?.message} icon="email" id="register-email" inputMode="email" label="Email address" placeholder="Enter your email address" registration={register("email")} spellCheck={false} type="email" />
        <PasswordField autoComplete="new-password" error={errors.password?.message} id="register-password" label="Password" placeholder="Create your password" registration={register("password")} />
        <p className="-mt-2 text-xs leading-5 text-[#776566]">Use at least 12 characters. Your password is kept exactly as you enter it.</p>
        <PasswordField autoComplete="new-password" error={errors.confirmPassword?.message} id="register-confirm-password" label="Confirm password" placeholder="Confirm your password" registration={register("confirmPassword")} />
      </div>
      <button className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" type="submit">Create account</button>
      <AuthFormStatus message={statusMessage} />
      <p className="mt-6 text-center text-sm text-[#554243]">Already have an account? <Link className="rounded-md font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4 transition hover:text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/login">Log in</Link></p>
    </form>
  );
}
