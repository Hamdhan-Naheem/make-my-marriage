"use client";

import { useState } from "react";
import { navigationItems } from "@/content/landing-content";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAppSelector } from "@/store/hooks";
import { AccountLink } from "./account-link";

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const authStatus = useAppSelector((state) => state.auth.status);

  const accountActions = authStatus === "checking"
    ? <span aria-hidden="true" className="h-10 w-40 animate-pulse rounded-lg bg-[#e8dfd8]" />
    : authStatus === "authenticated"
      ? <AccountLink className="bg-[#852c3a] text-white" href="/login" label="My Account" />
      : <><AccountLink className="text-[#554243]" href="/login" label="Log In" /><AccountLink className="bg-[#852c3a] text-white" href="/register" label="Create Your Wedding" /></>;

  return (
    <header className="sticky top-0 z-30 border-b border-[#852c3a]/10 bg-[#fcf9f8]/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a aria-label="Make My Marriage home" href="#top"><BrandMark /></a>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {navigationItems.map((item) => <a className="nav-link rounded-md px-3 py-2 text-sm font-medium text-[#554243] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          {accountActions}
        </div>
        <div className="relative lg:hidden">
          <button aria-controls="mobile-navigation" aria-expanded={isMenuOpen} aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} className="menu-toggle rounded-lg border border-[#e8dfd8] bg-white p-2 text-[#671525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => setIsMenuOpen((isOpen) => !isOpen)} type="button">
            <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <nav aria-label="Mobile navigation" className={`mobile-menu ${isMenuOpen ? "mobile-menu-open" : "mobile-menu-closed"}`} id="mobile-navigation">
            <div className="mobile-menu-content grid gap-1">
              {navigationItems.map((item) => <a className="nav-link rounded-lg px-3 py-2 text-sm font-medium text-[#554243] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={item.href} key={item.href} onClick={() => setIsMenuOpen(false)}>{item.label}</a>)}
              <div className="mt-2 grid gap-2 border-t border-[#e8dfd8] pt-3 sm:hidden">
                {accountActions}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
