"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { WeddingSide } from "@make-my-marriage/shared";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";

type EventDetailsPreview = {
  name: string;
  description?: string;
  side: WeddingSide;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  address?: string;
};

function sideLabel(side: WeddingSide) {
  return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-LK", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2027, 0, 1, hour, minute)));
}

export function EventDetailsScreen({ context, eventId }: { context: EventsWeddingContext; eventId: string }) {
  const { wedding, ownerName } = context;
  const side: WeddingSide = wedding.managementType === "BRIDE_SIDE" ? "BRIDE" : wedding.managementType === "GROOM_SIDE" ? "GROOM" : "BOTH";
  const event: EventDetailsPreview = {
    name: "Sample Wedding Ceremony",
    description: "A clearly fictional event preview showing how saved Event details will be presented after backend integration.",
    side,
    eventDate: "2027-01-20",
    startTime: "10:00",
    endTime: "13:30",
    venueName: "Sample Celebration Hall",
    address: "Sample address, Colombo",
  };
  const overviewPath = `/weddings/${wedding.id}/events`;

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <Link className="inline-flex rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={overviewPath}>← Back to Events</Link>
        <div className="mt-5 rounded-xl border border-[#e1c4ad] bg-[#fff6ed] px-4 py-3 text-sm leading-6 text-[#70452d]" role="status"><strong>Frontend-only preview.</strong> This fictional Event is not loaded from or saved to the database. Event ID <code className="break-all">{eventId}</code> is used only for route presentation.</div>
        <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{event.name}</h1><span className="rounded-full bg-[#ffdad2] px-2.5 py-1 text-xs font-bold text-[#703628]">{sideLabel(event.side)}</span></div><p className="mt-2 text-xs text-[#776566]">Previewed by {ownerName} · Owner</p></div>
          <Link className="inline-flex w-full items-center justify-center rounded-xl border border-[#d9c9ca] bg-white px-5 py-3 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${wedding.id}/events/${eventId}/edit`}>Edit Event</Link>
        </header>

        <section className="mt-7 overflow-hidden rounded-2xl border border-[#e8dfd8] bg-white shadow-sm" aria-labelledby="event-summary-title">
          <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Overview</p><h2 className="mt-2 text-lg font-bold" id="event-summary-title">Event Summary</h2><p className="mt-3 text-sm leading-6 text-[#665456]">{event.description || "No description has been added."}</p></div>
          <dl className="grid gap-px bg-[#e8dfd8] sm:grid-cols-2"><div className="bg-[#f6f3f2] p-4 sm:p-5"><dt className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Wedding workspace</dt><dd className="mt-2 text-sm font-bold">{wedding.name}</dd></div><div className="bg-[#f6f3f2] p-4 sm:p-5"><dt className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Event side</dt><dd className="mt-2 text-sm font-bold">{sideLabel(event.side)}</dd></div></dl>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <DetailsCard title="Event Schedule">
            {event.eventDate ? <><p className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Confirmed date</p><p className="mt-2 font-bold text-[#671525]">{formatDate(event.eventDate)}</p>{event.startTime ? <><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#887273]">Timing</p><p className="mt-2 text-sm font-semibold">{formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ""}</p></> : <p className="mt-4 text-sm text-[#665456]">Time not added yet.</p>}</> : <p className="text-sm leading-6 text-[#665456]">Schedule not added yet. A saved Event may remain unscheduled.</p>}
          </DetailsCard>
          <DetailsCard title="Event Location">
            {event.venueName || event.address ? <><p className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Venue</p><p className="mt-2 font-bold text-[#302526]">{event.venueName || "Venue name not added"}</p>{event.address ? <p className="mt-3 text-sm leading-6 text-[#665456]">{event.address}</p> : null}</> : <p className="text-sm leading-6 text-[#665456]">Location not added yet.</p>}
          </DetailsCard>
        </div>
      </main>
    </WeddingWorkspaceShell>
  );
}

function DetailsCard({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-5 text-lg font-bold text-[#671525]">{title}</h2>{children}</section>;
}
