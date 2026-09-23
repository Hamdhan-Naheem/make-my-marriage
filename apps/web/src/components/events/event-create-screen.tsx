"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";

export function EventCreateScreen({ context }: { context: EventsWeddingContext }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const overviewPath = `/weddings/${wedding.id}/events`;

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(overviewPath)} type="button">← Back to Events</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Event setup</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Create Event</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Add the essential details now. Schedule and location can remain undecided.</p></div>
        <EventForm managementType={wedding.managementType} mode="create" onCancel={() => router.push(overviewPath)} />
      </main>
    </WeddingWorkspaceShell>
  );
}
