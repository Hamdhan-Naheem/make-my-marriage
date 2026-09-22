"use client";

import Link from "next/link";
import { useAuthLogout } from "@/lib/use-auth-logout";

export function DashboardAccountMenu({ ownerName }: { ownerName: string }) {
  const { handleLogout, isLoggingOut, logoutError } = useAuthLogout();

  return (
    <details className="group relative shrink-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#dbcfd0] bg-white px-2.5 py-2 text-sm font-bold text-[#554243] shadow-sm transition hover:border-[#c47a68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-[#671525] text-xs text-white">{ownerName.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-36 truncate sm:block">{ownerName}</span>
        <span aria-hidden="true" className="text-xs transition group-open:rotate-180">⌄</span>
        <span className="sr-only">Open account menu</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-[#e3d8d4] bg-white p-2 shadow-xl shadow-[#671525]/10">
        <nav aria-label="Account menu" className="grid gap-1">
          <Link className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-[#852c3a]" href="/account">My Account</Link>
          <Link className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-[#852c3a]" href="/weddings">Switch Wedding</Link>
          <button aria-busy={isLoggingOut} className="rounded-lg px-3 py-2.5 text-left text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-2 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoggingOut} onClick={handleLogout} type="button">{isLoggingOut ? "Logging out…" : "Log Out"}</button>
        </nav>
        {logoutError ? <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[#a22531]" role="alert">{logoutError}</p> : null}
      </div>
    </details>
  );
}
