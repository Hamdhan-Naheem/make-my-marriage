"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/api";
import { signedOut } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AccountView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string>();

  async function handleLogout() {
    setIsLoggingOut(true);
    setError(undefined);
    try {
      await logout();
      dispatch(signedOut());
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Logout could not be completed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <p aria-live="polite" className="mt-6 text-sm text-[#665456]">Checking your session…</p>;
  }

  return (
    <div className="mt-6">
      <dl className="grid gap-4 rounded-xl border border-[#e3d8d4] bg-[#fdfaf9] p-4 text-sm">
        <div><dt className="font-bold text-[#3e3031]">Name</dt><dd className="mt-1 text-[#665456]">{[user.firstName, user.lastName].filter(Boolean).join(" ")}</dd></div>
        <div><dt className="font-bold text-[#3e3031]">Email</dt><dd className="mt-1 break-all text-[#665456]">{user.email}</dd></div>
        <div><dt className="font-bold text-[#3e3031]">Email status</dt><dd className="mt-1 text-[#665456]">{user.emailVerified ? "Verified" : "Pending verification"}</dd></div>
      </dl>
      {error ? <p className="mt-4 text-sm font-medium text-[#7b2030]" role="alert">{error}</p> : null}
      <button aria-busy={isLoggingOut} className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-65" disabled={isLoggingOut} onClick={handleLogout} type="button">{isLoggingOut ? "Logging out…" : "Log out"}</button>
    </div>
  );
}
