"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { WeddingEvent } from "@make-my-marriage/shared";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { formatEventDate, formatEventTime, sideLabel } from "@/components/events/events-overview";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { EventTasksPanel } from "@/components/tasks/event-tasks-panel";
import { ApiError, getEvent } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

export function EventDetailsScreen({ context, eventId }: { context: EventsWeddingContext; eventId: string }) {
  const { wedding, ownerName } = context;
  const returnTo = `/weddings/${wedding.id}/events/${eventId}`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [requestState, setRequestState] = useState<{ eventId: string; event?: WeddingEvent; error?: string }>({ eventId });
  const event = requestState.eventId === eventId ? requestState.event : undefined;
  const error = requestState.eventId === eventId ? requestState.error : undefined;
  const overviewPath = `/weddings/${wedding.id}/events`;

  useEffect(() => {
    let active = true;
    getEvent(wedding.id, eventId)
      .then((result) => { if (active) setRequestState({ eventId, event: result }); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        const message = requestError instanceof ApiError && requestError.status === 404 ? "This Event was not found in the selected wedding." : "The Event could not be loaded. Please try again.";
        setRequestState({ eventId, error: message });
      });
    return () => { active = false; };
  }, [eventId, handleTerminalAuth, wedding.id]);

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <Link className="inline-flex rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={overviewPath}>← Back to Events</Link>
        {!event && !error ? <EventDetailsStatus message="Loading Event details…" /> : null}
        {error ? <EventDetailsStatus message={error} retry={() => window.location.reload()} /> : null}
        {event ? <EventDetails event={event} eventId={eventId} ownerName={ownerName} weddingId={wedding.id} weddingName={wedding.name} /> : null}
      </main>
    </WeddingWorkspaceShell>
  );
}

function EventDetails({ event, eventId, ownerName, weddingId, weddingName }: { event: WeddingEvent; eventId: string; ownerName: string; weddingId: string; weddingName: string }) {
  return <>
    <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{event.name}</h1><span className="rounded-full bg-[#ffdad2] px-2.5 py-1 text-xs font-bold text-[#703628]">{sideLabel(event.side)}</span></div><p className="mt-2 text-xs text-[#776566]">Wedding Owner view · {ownerName}</p></div>
      <Link className="inline-flex w-full items-center justify-center rounded-xl border border-[#d9c9ca] bg-white px-5 py-3 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`/weddings/${weddingId}/events/${eventId}/edit`}>Edit Event</Link>
    </header>
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#e8dfd8] bg-white shadow-sm" aria-labelledby="event-summary-title">
      <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Overview</p><h2 className="mt-2 text-lg font-bold" id="event-summary-title">Event Summary</h2><p className="mt-3 text-sm leading-6 text-[#665456]">{event.description || "No description has been added."}</p></div>
      <dl className="grid gap-px bg-[#e8dfd8] sm:grid-cols-2"><div className="bg-[#f6f3f2] p-4 sm:p-5"><dt className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Wedding workspace</dt><dd className="mt-2 text-sm font-bold">{weddingName}</dd></div><div className="bg-[#f6f3f2] p-4 sm:p-5"><dt className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Event side</dt><dd className="mt-2 text-sm font-bold">{sideLabel(event.side)}</dd></div></dl>
    </section>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <DetailsCard title="Event Schedule">
        {event.eventDate ? <><p className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Confirmed date</p><p className="mt-2 font-bold text-[#671525]">{formatEventDate(event.eventDate)}</p>{event.startTime ? <><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#887273]">Timing</p><p className="mt-2 text-sm font-semibold">{formatEventTime(event.startTime)}{event.endTime ? ` – ${formatEventTime(event.endTime)}` : ""}</p></> : <p className="mt-4 text-sm text-[#665456]">Time not added yet.</p>}</> : <p className="text-sm leading-6 text-[#665456]">Schedule not added yet.</p>}
      </DetailsCard>
      <DetailsCard title="Event Location">
        {event.venueName || event.address ? <><p className="text-xs font-semibold uppercase tracking-wide text-[#887273]">Venue</p><p className="mt-2 font-bold text-[#302526]">{event.venueName || "Venue name not added"}</p>{event.address ? <p className="mt-3 text-sm leading-6 text-[#665456]">{event.address}</p> : null}</> : <p className="text-sm leading-6 text-[#665456]">Location not added yet.</p>}
      </DetailsCard>
    </div>
    <EventTasksPanel event={event} weddingId={weddingId} />
  </>;
}

function EventDetailsStatus({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="mt-7 rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={retry} type="button">Try again</button> : null}</section>;
}

function DetailsCard({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-5 text-lg font-bold text-[#671525]">{title}</h2>{children}</section>;
}
