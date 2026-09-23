"use client";

import { useRouter } from "next/navigation";
import type { WeddingSide } from "@make-my-marriage/shared";
import { EventForm } from "@/components/events/event-form";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import type { EventFormValues } from "@/lib/validation/event-schema";

export function EventEditScreen({ context, eventId }: { context: EventsWeddingContext; eventId: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const side: WeddingSide = wedding.managementType === "BRIDE_SIDE" ? "BRIDE" : wedding.managementType === "GROOM_SIDE" ? "GROOM" : "BOTH";
  const previewValues: EventFormValues = {
    name: "Sample Wedding Ceremony",
    description: "A clearly fictional Event used to preview the Edit interface before the Events backend is connected.",
    side,
    eventDate: "2027-01-20",
    startTime: "10:00",
    endTime: "13:30",
    venueName: "Sample Celebration Hall",
    address: "Sample address, Colombo",
  };
  const detailsPath = `/weddings/${wedding.id}/events/${eventId}`;

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(detailsPath)} type="button">← Back to Event Details</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Event setup · preview route {eventId}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Event</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Review the responsive Edit form and its wedding-side behavior. Changes are not persisted.</p></div>
        <EventForm initialValues={previewValues} managementType={wedding.managementType} mode="edit" onCancel={() => router.push(detailsPath)} preview />
      </main>
    </WeddingWorkspaceShell>
  );
}
