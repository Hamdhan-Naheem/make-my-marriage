"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { WeddingEvent, WeddingSide } from "@make-my-marriage/shared";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { listEvents } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

export function EventsOverview({ context }: { context: EventsWeddingContext }) {
  const { wedding, ownerName } = context;
  const returnTo = `/weddings/${wedding.id}/events`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const allowedSides: WeddingSide[] = wedding.managementType === "JOINT" ? ["BRIDE", "GROOM", "BOTH"] : [wedding.managementType === "BRIDE_SIDE" ? "BRIDE" : "GROOM"];
  const [filter, setFilter] = useState<"ALL" | WeddingSide>("ALL");
  const [requestState, setRequestState] = useState<{ weddingId: string; events?: WeddingEvent[]; error?: string }>({ weddingId: wedding.id });
  const events = requestState.weddingId === wedding.id ? requestState.events : undefined;
  const error = requestState.weddingId === wedding.id ? requestState.error : undefined;

  useEffect(() => {
    let active = true;
    listEvents(wedding.id)
      .then((items) => { if (active) setRequestState({ weddingId: wedding.id, events: items }); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        setRequestState({ weddingId: wedding.id, error: "Events could not be loaded. Please try again." });
      });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.id]);

  const visibleEvents = events?.filter((event) => filter === "ALL" || event.side === filter) ?? [];

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Wedding events</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1b1c1c]">Events</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#665456]">Organize every celebration within this wedding workspace.</p></div>
          <Link className="inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${wedding.id}/events/new`}>+ Create Event</Link>
        </div>

        <div className="mt-6 overflow-x-auto" aria-label="Event side filter" role="group">
          <div className="inline-flex min-w-max gap-1 rounded-xl bg-[#f0eded] p-1">
            <FilterButton active={filter === "ALL"} onClick={() => setFilter("ALL")}>All ({events?.length ?? 0})</FilterButton>
            {allowedSides.map((side) => <FilterButton active={filter === side} key={side} onClick={() => setFilter(side)}>{sideLabel(side)} ({events?.filter((event) => event.side === side).length ?? 0})</FilterButton>)}
          </div>
        </div>

        {!events && !error ? <EventStatus message="Loading wedding events…" /> : null}
        {error ? <EventStatus message={error} retry={() => window.location.reload()} /> : null}
        {events && visibleEvents.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#e8dfd8] bg-white px-5 py-14 text-center shadow-sm sm:px-8 sm:py-20" aria-labelledby="events-empty-title">
            <span aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f4e8e5] text-2xl text-[#852c3a]">◇</span>
            <h2 className="mt-5 text-xl font-bold" id="events-empty-title">{filter === "ALL" ? "Create your first wedding event" : "No events match this side"}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#665456]">{filter === "ALL" ? "Add a custom celebration now. The date, time, and location can remain undecided." : "Choose another side filter or create an Event for this side."}</p>
            <Link className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${wedding.id}/events/new`}>+ Create Event</Link>
          </section>
        ) : null}
        {events && visibleEvents.length > 0 ? (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Wedding events">
            {visibleEvents.map((event) => (
              <Link className="rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm transition hover:border-[#c47a68] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href={`/weddings/${wedding.id}/events/${event.id}`} key={event.id}>
                <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-[#302526]">{event.name}</h2><span className="shrink-0 rounded-full bg-[#ffdad2] px-2.5 py-1 text-[0.68rem] font-bold text-[#703628]">{sideLabel(event.side)}</span></div>
                <p className="mt-4 text-sm font-semibold text-[#671525]">{event.eventDate ? formatEventDate(event.eventDate) : "Date undecided"}</p>
                <p className="mt-1 text-xs text-[#665456]">{event.startTime ? `${formatEventTime(event.startTime)}${event.endTime ? ` – ${formatEventTime(event.endTime)}` : ""}` : "Time not added"}</p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#665456]">{event.description || event.venueName || "No description or venue added yet."}</p>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </WeddingWorkspaceShell>
  );
}

export function sideLabel(side: WeddingSide) {
  return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side";
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function formatEventTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-LK", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2027, 0, 1, hour, minute)));
}

function EventStatus({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="mt-8 rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={retry} type="button">Try again</button> : null}</div>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button aria-pressed={active} className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] ${active ? "bg-white text-[#671525] shadow-sm" : "text-[#665456] hover:text-[#302526]"}`} onClick={onClick} type="button">{children}</button>;
}
