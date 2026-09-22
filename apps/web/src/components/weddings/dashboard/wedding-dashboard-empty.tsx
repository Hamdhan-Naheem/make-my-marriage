"use client";

import { useState } from "react";
import type { WeddingMemberRole } from "@make-my-marriage/shared";
import { BrandMark } from "@/components/brand/brand-mark";
import { DashboardAccountMenu } from "@/components/weddings/dashboard/dashboard-account-menu";
import type { WeddingCreatorSide, WeddingManagementType } from "@/lib/validation/wedding-onboarding-schema";

export type EmptyWeddingDashboardData = {
  workspaceName: string;
  brideName: string;
  groomName: string;
  managementType: WeddingManagementType;
  creatorSide: WeddingCreatorSide;
  mainWeddingDate?: string;
  ownerName: string;
  memberRole: WeddingMemberRole;
};

const navigation = ["Dashboard", "Events", "Tasks", "Guests", "Invitations & RSVP", "Budget & Expenses", "Vendors", "Vendor Discovery", "Documents"];

function formatManagementType(value: WeddingManagementType) {
  return value === "JOINT" ? "Joint Wedding" : value === "BRIDE_SIDE" ? "Bride Side" : "Groom Side";
}

function formatSide(value: WeddingCreatorSide) {
  return value === "BOTH" ? "Both sides" : `${value[0]}${value.slice(1).toLowerCase()} side`;
}

function formatRole(value: WeddingMemberRole) {
  return value === "FAMILY_MEMBER" ? "Family Member" : value[0] + value.slice(1).toLowerCase();
}

function formatDate(value?: string) {
  if (!value) return "Not decided yet";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function WeddingDashboardEmpty({ data, onBack, preview = false, onCreateEvent }: { data: EmptyWeddingDashboardData; onBack?: () => void; preview?: boolean; onCreateEvent?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventNotice, setEventNotice] = useState(false);

  const sidebar = (
    <>
      <div>
        <div className="border-b border-[#ece3df] px-5 py-5"><BrandMark /></div>
        <p className="px-5 pb-2 pt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#887273]">Workspace</p>
        <nav aria-label="Wedding workspace">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => <li key={item}><span className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${item === "Dashboard" ? "bg-[#852c3a] text-white" : "text-[#554243]"}`}>{item}</span></li>)}
          </ul>
        </nav>
        <p className="px-5 pb-2 pt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#887273]">Coordination</p>
        <div className="space-y-1 px-3 text-sm font-semibold text-[#554243]"><p className="rounded-lg px-3 py-2.5">Members & Permissions</p><p className="rounded-lg px-3 py-2.5">Wedding Settings</p></div>
      </div>
      <div className="border-t border-[#ece3df] bg-[#f6f3f2] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white p-3">
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-[#671525] font-bold text-white">{data.ownerName.charAt(0).toUpperCase()}</span>
          <span className="min-w-0"><strong className="block truncate text-sm">{data.ownerName}</strong><span className="block truncate text-xs text-[#665456]">{formatRole(data.memberRole)} · {formatSide(data.creatorSide)}</span></span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-[#fcf9f8] text-[#1b1c1c]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-[#ece3df] bg-white lg:flex">{sidebar}</aside>
      {menuOpen ? <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMenuOpen(false)} type="button" /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col justify-between bg-white shadow-2xl transition-transform lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[#ece3df] bg-[#fcf9f8]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-expanded={menuOpen} aria-label="Open navigation" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#dbcfd0] bg-white text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] lg:hidden" onClick={() => setMenuOpen(true)} type="button">☰</button>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-[#671525] sm:text-base">{data.workspaceName}</p><p className="text-xs text-[#665456]">Wedding workspace</p></div>
          </div>
          {onBack ? <button className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-[#671525] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] sm:text-sm" onClick={onBack} type="button">Back to review</button> : <DashboardAccountMenu ownerName={data.ownerName} />}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          {preview ? <div className="mb-6 rounded-xl border border-[#e1c4ad] bg-[#fff6ed] px-4 py-3 text-sm text-[#70452d]" role="status"><strong>Dashboard preview.</strong> This wedding has not been created or saved.</div> : null}
          <section className="rounded-2xl bg-[#671525] px-5 py-7 text-white shadow-xl shadow-[#671525]/10 sm:px-8 sm:py-9">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffdadb]">Getting started</p>
            <div className="mt-3 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome to {data.workspaceName}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3dedf] sm:text-base">Your wedding workspace is ready for its first plan. Start by creating an event for the ceremony, reception, or another celebration.</p></div>
              <button className="w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#671525] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white md:w-auto" onClick={() => onCreateEvent ? onCreateEvent() : setEventNotice(true)} type="button">Create your first event</button>
            </div>
            {eventNotice ? <p className="mt-5 rounded-lg bg-white/10 px-4 py-3 text-sm text-white" role="status">Event creation will be connected in a later milestone. No event has been created.</p> : null}
          </section>

          <section className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-5 sm:p-6" aria-labelledby="wedding-overview-title">
            <h2 className="text-lg font-bold" id="wedding-overview-title">Wedding overview</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Bride", data.brideName], ["Groom", data.groomName], ["Planning style", formatManagementType(data.managementType)], ["Wedding date", formatDate(data.mainWeddingDate)],
              ].map(([label, value]) => <div className="rounded-xl bg-[#f6f3f2] p-4" key={label}><dt className="text-xs font-semibold text-[#776566]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#302526]">{value}</dd></div>)}
            </dl>
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Empty wedding workspace sections">
            {[
              ["Events", "No wedding events have been created yet.", "Create your first event"],
              ["Tasks", "Tasks will appear here once planning begins.", "Add tasks after your first event"],
              ["Guests", "No guests have been added to this wedding.", "Guest management is ready for later"],
              ["Vendors", "No vendors have been saved or added.", "Build your vendor list later"],
              ["Invitations & RSVP", "No invitations have been created.", "Invitations follow your event and guest setup"],
              ["Documents", "No documents have been uploaded.", "Keep wedding files together later"],
            ].map(([title, copy, note]) => <article className="rounded-2xl border border-[#e8dfd8] bg-white p-5" key={title}><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-[#f4e8e5] font-bold text-[#852c3a]">·</span><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#665456]">{copy}</p><p className="mt-4 text-xs font-semibold text-[#852c3a]">{note}</p></article>)}
          </section>
        </main>
      </div>
    </div>
  );
}
