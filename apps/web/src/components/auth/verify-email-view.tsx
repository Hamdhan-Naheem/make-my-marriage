"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, verifyEmail } from "@/lib/api";

type VerificationState =
  | { status: "checking"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function VerifyEmailView({ token }: { token?: string }) {
  const started = useRef(false);
  const [state, setState] = useState<VerificationState>(() => token
    ? { status: "checking", message: "Checking your verification link…" }
    : { status: "error", message: "This verification link is invalid or incomplete." });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) return;

    verifyEmail(token)
      .then((message) => {
        window.history.replaceState({}, "", "/verify-email");
        setState({ status: "success", message });
      })
      .catch((error: unknown) => {
        window.history.replaceState({}, "", "/verify-email");
        setState({
          status: "error",
          message: error instanceof ApiError ? error.message : "Verification is temporarily unavailable. Please try again.",
        });
      });
  }, [token]);

  return (
    <div className="mt-6 text-center">
      <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm leading-6 ${state.status === "success" ? "border-[#4f7555]/25 bg-[#f3f8f3] text-[#315337]" : state.status === "error" ? "border-[#a32d3c]/25 bg-[#fdf6f4] text-[#7b2030]" : "border-[#e8dfd8] bg-[#fdfaf9] text-[#665456]"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      {state.status === "success" ? <Link className="mt-6 inline-flex rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white" href="/login">Continue to Log In</Link> : null}
      {state.status === "error" ? <Link className="mt-5 inline-block rounded-md text-sm font-bold text-[#7f2736] underline decoration-[#c47a68]/60 underline-offset-4" href="/resend-verification">Request another verification link</Link> : null}
    </div>
  );
}
