"use client";

import { useState } from "react";
import type { WeddingMemberRole } from "@make-my-marriage/shared";
import { WeddingWorkspaceShell, formatManagementType } from "@/components/weddings/dashboard/wedding-workspace-shell";
import type { WeddingCreatorSide, WeddingManagementType } from "@/lib/validation/wedding-onboarding-schema";

export type EmptyWeddingDashboardData = {
  weddingId?: string;
  workspaceName: string;
  brideName: string;
  groomName: string;
  managementType: WeddingManagementType;
  creatorSide: WeddingCreatorSide;
  mainWeddingDate?: string;
  ownerName: string;
  memberRole: WeddingMemberRole;
};

function formatDate(value?: string) {
  if (!value) return "Not decided yet";
  return new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function getDashboardPlanningState(eventCount: number, taskCount: number) {
  const hasEvents = eventCount > 0;
  return {
    hasEvents,
    eyebrow: hasEvents ? "Wedding planning" : "Getting started",
    heroCopy: hasEvents
      ? `Your workspace has ${eventCount} ${eventCount === 1 ? "event" : "events"} and ${taskCount} ${taskCount === 1 ? "task" : "tasks"}. Keep the plan moving from the Events and Task Planner workspaces.`
      : "Your wedding workspace is ready for its first plan. Start by creating an event for the ceremony, reception, or another celebration.",
    eventActionLabel: hasEvents ? "View events" : "Create your first event",
    eventsCopy: hasEvents ? `${eventCount} wedding ${eventCount === 1 ? "event is" : "events are"} currently planned.` : "No wedding events have been created yet.",
    eventsNote: hasEvents ? "View wedding events" : "Create your first event",
    tasksCopy: taskCount > 0 ? `${taskCount} ${taskCount === 1 ? "task is" : "tasks are"} currently in the planner.` : "No planning tasks have been added yet.",
    tasksNote: taskCount > 0 ? "Open the Task Planner" : "Add tasks from an event or the Task Planner",
  };
}

export function WeddingDashboardEmpty({ data, eventCount = 0, onBack, preview = false, onEventsAction, taskCount = 0 }: { data: EmptyWeddingDashboardData; eventCount?: number; onBack?: () => void; preview?: boolean; onEventsAction?: () => void; taskCount?: number }) {
  const [eventNotice, setEventNotice] = useState(false);
  const planningState = getDashboardPlanningState(eventCount, taskCount);
  const workspaceSections = [
    ["Events", planningState.eventsCopy, planningState.eventsNote],
    ["Tasks", planningState.tasksCopy, planningState.tasksNote],
    ["Guests", "No guests have been added to this wedding.", "Guest management is ready for later"],
    ["Vendors", "No vendors have been saved or added.", "Build your vendor list later"],
    ["Invitations & RSVP", "No invitations have been created.", "Invitations follow your event and guest setup"],
    ["Documents", "No documents have been uploaded.", "Keep wedding files together later"],
  ];

  return (
    <WeddingWorkspaceShell
      activeItem="Dashboard"
      data={{ weddingId: data.weddingId, workspaceName: data.workspaceName, managementType: data.managementType, memberSide: data.creatorSide, memberRole: data.memberRole, ownerName: data.ownerName }}
      headerAction={onBack ? <button className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-[#671525] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] sm:text-sm" onClick={onBack} type="button">Back to review</button> : undefined}
    >
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        {preview ? <div className="mb-6 rounded-xl border border-[#e1c4ad] bg-[#fff6ed] px-4 py-3 text-sm text-[#70452d]" role="status"><strong>Dashboard preview.</strong> This wedding has not been created or saved.</div> : null}
        <section className="rounded-2xl bg-[#671525] px-5 py-7 text-white shadow-xl shadow-[#671525]/10 sm:px-8 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ffdadb]">{planningState.eyebrow}</p>
          <div className="mt-3 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome to {data.workspaceName}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3dedf] sm:text-base">{planningState.heroCopy}</p></div>
            <button className="w-full rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#671525] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white md:w-auto" onClick={() => onEventsAction ? onEventsAction() : setEventNotice(true)} type="button">{planningState.eventActionLabel}</button>
          </div>
          {eventNotice ? <p className="mt-5 rounded-lg bg-white/10 px-4 py-3 text-sm text-white" role="status">Event creation will be connected in a later milestone. No event has been created.</p> : null}
        </section>

        <section className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-5 sm:p-6" aria-labelledby="wedding-overview-title">
          <h2 className="text-lg font-bold" id="wedding-overview-title">Wedding overview</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Bride", data.brideName], ["Groom", data.groomName], ["Planning style", formatManagementType(data.managementType)], ["Wedding date", formatDate(data.mainWeddingDate)]].map(([label, value]) => <div className="rounded-xl bg-[#f6f3f2] p-4" key={label}><dt className="text-xs font-semibold text-[#776566]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#302526]">{value}</dd></div>)}
          </dl>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Wedding workspace sections">
          {workspaceSections.map(([title, copy, note]) => <article className="rounded-2xl border border-[#e8dfd8] bg-white p-5" key={title}><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-[#f4e8e5] font-bold text-[#852c3a]">·</span><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#665456]">{copy}</p><p className="mt-4 text-xs font-semibold text-[#852c3a]">{note}</p></article>)}
        </section>
      </main>
    </WeddingWorkspaceShell>
  );
}
