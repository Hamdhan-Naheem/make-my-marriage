"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, login } from "@/lib/api";
import { loadCurrentUser } from "@/lib/auth-session";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth-schemas";
import { authenticated } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { AuthFormStatus } from "./auth-form-status";
import { AuthTextField } from "./auth-text-field";
import { PasswordField } from "./password-field";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [statusMessage, setStatusMessage] = useState<string>();
  const { handleSubmit, register, setError, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  async function handleValidSubmission(values: LoginFormValues) {
    setStatusMessage(undefined);

    try {
      await login(values);
      const user = await loadCurrentUser();
      dispatch(authenticated(user));
      router.replace("/account");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fields?.email?.[0]) setError("email", { type: "server", message: error.fields.email[0] });
        if (error.fields?.password?.[0]) setError("password", { type: "server", message: error.fields.password[0] });
        setStatusMessage(error.message);
        return;
      }

      setStatusMessage("Sign in is temporarily unavailable. Please try again.");
    }
  }

  return (
    <form className="mt-6" noValidate onSubmit={handleSubmit(handleValidSubmission)}>
      <div className="grid gap-4">
        <AuthTextField autoCapitalize="none" autoComplete="email" error={errors.email?.message} icon="email" id="login-email" inputMode="email" label="Email address" placeholder="Enter your email address" registration={register("email")} spellCheck={false} type="email" />
        <div>
          <PasswordField autoComplete="current-password" error={errors.password?.message} id="login-password" label="Password" placeholder="Enter your password" registration={register("password")} />
          <Link className="mt-2 inline-block rounded-md text-sm font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4 transition hover:text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/forgot-password">Forgot password?</Link>
        </div>
      </div>
      <button aria-busy={isSubmitting} className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-65" disabled={isSubmitting} type="submit">{isSubmitting ? "Logging in…" : "Log in"}</button>
      <AuthFormStatus message={statusMessage} />
      <p className="mt-6 text-center text-sm text-[#554243]">New to Make My Marriage? <Link className="rounded-md font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4 transition hover:text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/register">Create an account</Link></p>
    </form>
  );
}
