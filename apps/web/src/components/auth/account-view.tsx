"use client";

import Link from "next/link";
import { useAuthLogout } from "@/lib/use-auth-logout";
import { useAppSelector } from "@/store/hooks";

export function AccountView() {
  const user = useAppSelector((state) => state.auth.user);
  const { handleLogout, isLoggingOut, logoutError } = useAuthLogout();

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
      <Link className="mt-6 block w-full rounded-xl border border-[#852c3a] px-4 py-3 text-center text-sm font-bold text-[#852c3a] transition hover:bg-[#fff7f6] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/weddings">Open wedding workspaces</Link>
      {logoutError ? <p className="mt-4 text-sm font-medium text-[#7b2030]" role="alert">{logoutError}</p> : null}
      <button aria-busy={isLoggingOut} className="mt-6 w-full rounded-xl bg-[#852c3a] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-65" disabled={isLoggingOut} onClick={handleLogout} type="button">{isLoggingOut ? "Logging out…" : "Log out"}</button>
    </div>
  );
}
