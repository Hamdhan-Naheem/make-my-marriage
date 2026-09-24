"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { WeddingManagementType, WeddingMemberRole, WeddingSide } from "@make-my-marriage/shared";
import { BrandMark } from "@/components/brand/brand-mark";
import { DashboardAccountMenu } from "@/components/weddings/dashboard/dashboard-account-menu";

type WorkspaceNavigationItem = "Dashboard" | "Events" | "Tasks" | "Settings";

export type WeddingWorkspaceShellData = {
  weddingId?: string;
  workspaceName: string;
  managementType: WeddingManagementType;
  memberSide: WeddingSide;
  memberRole: WeddingMemberRole;
  ownerName: string;
};

const futureNavigation = [
  "Guests",
  "Invitations & RSVP",
  "Budget & Expenses",
  "Vendors",
  "Vendor Discovery",
  "Documents",
];

export function formatManagementType(value: WeddingManagementType) {
  return value === "JOINT" ? "Joint Wedding" : value === "BRIDE_SIDE" ? "Bride Side" : "Groom Side";
}

export function formatWeddingSide(value: WeddingSide) {
  return value === "BOTH" ? "Both sides" : `${value[0]}${value.slice(1).toLowerCase()} side`;
}

export function formatWeddingRole(value: WeddingMemberRole) {
  return value === "FAMILY_MEMBER" ? "Family Member" : value[0] + value.slice(1).toLowerCase();
}

function WorkspaceLink({ active, children, href }: { active: boolean; children: ReactNode; href?: string }) {
  const className = `block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#852c3a] text-white" : "text-[#554243] hover:bg-[#f6f3f2]"}`;
  return href ? <Link className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]`} href={href}>{children}</Link> : <span className={className}>{children}</span>;
}

export function WeddingWorkspaceShell({ activeItem, children, data, headerAction }: { activeItem: WorkspaceNavigationItem; children: ReactNode; data: WeddingWorkspaceShellData; headerAction?: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLElement>(null);
  const dashboardHref = data.weddingId ? `/weddings/${data.weddingId}` : undefined;
  const eventsHref = data.weddingId ? `/weddings/${data.weddingId}/events` : undefined;
  const tasksHref = data.weddingId && data.memberRole === "OWNER" ? `/weddings/${data.weddingId}/tasks` : undefined;
  const settingsHref = data.weddingId && data.memberRole === "OWNER" ? `/weddings/${data.weddingId}/settings` : undefined;

  const closeMobileNavigation = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    mobileNavigationRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMobileNavigation();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeMobileNavigation, menuOpen]);

  const sidebar = (
    <>
      <div>
        <div className="border-b border-[#ece3df] px-5 py-5"><BrandMark /></div>
        <p className="px-5 pb-2 pt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#887273]">Workspace</p>
        <nav aria-label="Wedding workspace">
          <ul className="space-y-1 px-3">
            <li><WorkspaceLink active={activeItem === "Dashboard"} href={dashboardHref}>Dashboard</WorkspaceLink></li>
            <li><WorkspaceLink active={activeItem === "Events"} href={eventsHref}>Events</WorkspaceLink></li>
            <li><WorkspaceLink active={activeItem === "Tasks"} href={tasksHref}>Tasks</WorkspaceLink></li>
            {futureNavigation.map((item) => <li key={item}><WorkspaceLink active={false}>{item}</WorkspaceLink></li>)}
          </ul>
        </nav>
        <p className="px-5 pb-2 pt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#887273]">Coordination</p>
        <div className="space-y-1 px-3 text-sm font-semibold text-[#554243]"><p className="rounded-lg px-3 py-2.5">Members & Permissions</p><WorkspaceLink active={activeItem === "Settings"} href={settingsHref}>Wedding Settings</WorkspaceLink></div>
      </div>
      <div className="border-t border-[#ece3df] bg-[#f6f3f2] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white p-3">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-[#671525] font-bold text-white">{data.ownerName.charAt(0).toUpperCase()}</span>
          <span className="min-w-0"><strong className="block truncate text-sm">{data.ownerName}</strong><span className="block truncate text-xs text-[#665456]">{formatWeddingRole(data.memberRole)} · {formatWeddingSide(data.memberSide)}</span></span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-[#fcf9f8] text-[#1b1c1c]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-[#ece3df] bg-white lg:flex">{sidebar}</aside>
      {menuOpen ? <><button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => closeMobileNavigation()} type="button" /><aside aria-label="Mobile wedding navigation" className="fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col justify-between bg-white shadow-2xl lg:hidden" id="mobile-wedding-navigation" onClick={(event) => { if ((event.target as HTMLElement).closest("a[href]")) closeMobileNavigation(false); }} ref={mobileNavigationRef}>{sidebar}</aside></> : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[#ece3df] bg-[#fcf9f8]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-controls="mobile-wedding-navigation" aria-expanded={menuOpen} aria-label="Open navigation" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#dbcfd0] bg-white text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] lg:hidden" onClick={() => setMenuOpen(true)} ref={menuButtonRef} type="button">☰</button>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-[#671525] sm:text-base">{data.workspaceName}</p><p className="text-xs text-[#665456]">{formatManagementType(data.managementType)}</p></div>
          </div>
          {headerAction ?? <DashboardAccountMenu ownerName={data.ownerName} />}
        </header>
        {children}
      </div>
    </div>
  );
}
