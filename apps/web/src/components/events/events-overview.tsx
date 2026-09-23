"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { WeddingSide } from "@make-my-marriage/shared";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";

export function EventsOverview({ context }: { context: EventsWeddingContext }) {
  const { wedding, ownerName } = context;
  const allowedSides: WeddingSide[] = wedding.managementType === "JOINT" ? ["BRIDE", "GROOM", "BOTH"] : [wedding.managementType === "BRIDE_SIDE" ? "BRIDE" : "GROOM"];
  const [filter, setFilter] = useState<"ALL" | WeddingSide>("ALL");

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Wedding events</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b1c1c]">Events</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#665456]">Organize every celebration within this wedding workspace.</p></div>
          <Link className="inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${wedding.id}/events/new`}>+ Create Event</Link>
        </div>

        <div className="mt-6 overflow-x-auto" aria-label="Event side filter" role="group">
          <div className="inline-flex min-w-max gap-1 rounded-xl bg-[#f0eded] p-1">
            <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>All (0)</FilterButton>
            {allowedSides.map((side) => <FilterButton active={filter === side} key={side} onClick={() => setFilter(side)}>{side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side"} (0)</FilterButton>)}
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-[#e8dfd8] bg-white px-5 py-14 text-center shadow-sm sm:px-8 sm:py-20" aria-labelledby="events-empty-title">
          <span aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f4e8e5] text-2xl text-[#852c3a]">◇</span>
          <h2 className="mt-5 text-xl font-bold" id="events-empty-title">{filter === "ALL" ? "Create your first wedding event" : "No events match this side"}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#665456]">{filter === "ALL" ? "No Events API is connected yet, so this workspace honestly shows no saved events. Start the Event form when you are ready to prepare the first celebration." : "No saved events are available for this side. Choose another filter or prepare a new event."}</p>
          <Link className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${wedding.id}/events/new`}>+ Create Event</Link>
        </section>

        <p className="mt-5 rounded-xl border border-[#e1c4ad] bg-[#fffaf5] px-4 py-3 text-xs leading-5 text-[#70452d]" role="status">Event listing is awaiting backend integration. No fictional Events are being presented as saved workspace data.</p>
      </main>
    </WeddingWorkspaceShell>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button aria-pressed={active} className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] ${active ? "bg-white text-[#671525] shadow-sm" : "text-[#665456] hover:text-[#302526]"}`} onClick={onClick} type="button">{children}</button>;
}
