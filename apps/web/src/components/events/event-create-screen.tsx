"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import type { EventsWeddingContext } from "@/components/events/events-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { createEvent, getBudgetSummary } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { toEventRequest, type EventFormValues } from "@/lib/validation/event-schema";

export function EventCreateScreen({ context }: { context: EventsWeddingContext }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const overviewPath = `/weddings/${wedding.id}/events`;
  const handleTerminalAuth = useTerminalAuthRedirect(`${overviewPath}/new`);
  const [allocation, setAllocation] = useState<{ maximum: string | null } | { error: string } | undefined>(wedding.currency ? undefined : { maximum: null });

  useEffect(() => {
    if (!wedding.currency) return;
    let active = true;
    getBudgetSummary(wedding.id)
      .then((summary) => { if (active) setAllocation({ maximum: summary.overall.unallocatedBudgetAmount }); })
      .catch((error: unknown) => {
        if (active && !handleTerminalAuth(error)) setAllocation({ error: "Budget allocation details could not be loaded. Please try again." });
      });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.currency, wedding.id]);

  async function submit(values: EventFormValues) {
    try {
      const event = await createEvent(wedding.id, toEventRequest(values));
      router.push(`${overviewPath}/${event.id}`);
    } catch (error) {
      if (!handleTerminalAuth(error)) throw error;
    }
  }

  return (
    <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(overviewPath)} type="button">← Back to Events</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Event setup</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Create Event</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Add the essential details and optional preparation Tasks. Schedule and location can remain undecided.</p></div>
        {!allocation ? <p aria-live="polite" className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center text-sm text-[#665456]">Loading budget allocation…</p> : "error" in allocation ? <div className="rounded-2xl border border-[#e5b7b8] bg-[#fff2f1] p-6 text-center"><p role="alert" className="text-sm text-[#8b1f2d]">{allocation.error}</p><button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white" onClick={() => window.location.reload()} type="button">Try again</button></div> : <EventForm budgetCurrency={wedding.currency} budgetSettingsHref={`/weddings/${wedding.id}/budget/settings`} managementType={wedding.managementType} maximumBudgetAmount={allocation.maximum} mode="create" onCancel={() => router.push(overviewPath)} onSubmit={submit} />}
      </main>
    </WeddingWorkspaceShell>
  );
}
