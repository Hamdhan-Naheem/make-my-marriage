"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingEvent } from "@make-my-marriage/shared";
import { EventForm } from "@/components/events/event-form";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getEvent, updateEvent } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { eventToFormValues, toEventRequest, type EventFormValues } from "@/lib/validation/event-schema";

export function EventEditScreen({ context, eventId }: { context: EventsWeddingContext; eventId: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const detailsPath = `/weddings/${wedding.id}/events/${eventId}`;
  const returnTo = `${detailsPath}/edit`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [requestState, setRequestState] = useState<{ eventId: string; event?: WeddingEvent; error?: string }>({ eventId });
  const event = requestState.eventId === eventId ? requestState.event : undefined;
  const error = requestState.eventId === eventId ? requestState.error : undefined;

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

  async function submit(values: EventFormValues) {
    try {
      await updateEvent(wedding.id, eventId, toEventRequest(values));
      router.push(detailsPath);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) throw requestError;
    }
  }

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(detailsPath)} type="button">← Back to Event Details</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Event setup</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Event</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Update the Event while preserving its wedding workspace and approved side rules.</p></div>
        {!event && !error ? <p aria-live="polite" className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center text-sm text-[#665456]">Loading Event…</p> : null}
        {error ? <div className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center"><p role="alert" className="text-sm text-[#665456]">{error}</p><button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white" onClick={() => window.location.reload()} type="button">Try again</button></div> : null}
        {event ? <EventForm initialValues={eventToFormValues(event)} managementType={wedding.managementType} mode="edit" onCancel={() => router.push(detailsPath)} onSubmit={submit} /> : null}
      </main>
    </WeddingWorkspaceShell>
  );
}
