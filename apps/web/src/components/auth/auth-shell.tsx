import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

type AuthShellProps = { children: ReactNode };

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1c]">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="border-b border-[#852c3a]/10 bg-[#fcf9f8]/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link aria-label="Make My Marriage home" href="/"><BrandMark /></Link>
          <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-[#554243] transition hover:bg-white hover:text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href="/">Back to home</Link>
        </div>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16" id="main-content">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-full bg-[radial-gradient(circle_at_20%_20%,rgba(196,122,104,0.14),transparent_26%),radial-gradient(circle_at_80%_72%,rgba(133,44,58,0.08),transparent_28%)]" />
        <div className="relative w-full">{children}</div>
      </main>
      <footer className="border-t border-[#e8dfd8] px-4 py-5 text-center text-xs text-[#776566] sm:px-6">
        © 2026 Make My Marriage · A calm wedding workspace for couples and families.
      </footer>
    </div>
  );
}
