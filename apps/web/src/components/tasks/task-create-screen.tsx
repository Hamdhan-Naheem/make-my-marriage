"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingEvent } from "@make-my-marriage/shared";
import { TaskForm } from "@/components/tasks/task-form";
import type { TaskWeddingContext } from "@/components/tasks/task-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { createTask, listEvents } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { toTaskRequest, type TaskFormValues } from "@/lib/validation/task-schema";

export function TaskCreateScreen({ context, initialEventId, navigationReturnTo }: { context: TaskWeddingContext; initialEventId?: string; navigationReturnTo?: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const plannerPath = `/weddings/${wedding.id}/tasks`;
  const returnPath = navigationReturnTo ?? plannerPath;
  const handleTerminalAuth = useTerminalAuthRedirect(`${plannerPath}/new`);
  const [events, setEvents] = useState<WeddingEvent[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    listEvents(wedding.id)
      .then((items) => { if (active) setEvents(items); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        setError("Wedding Events could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.id]);

  async function submit(values: TaskFormValues) {
    try {
      await createTask(wedding.id, toTaskRequest(values));
      router.push(returnPath);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) throw requestError;
    }
  }

  return (
    <WeddingWorkspaceShell activeItem="Tasks" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(returnPath)} type="button">← Back</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Task Planner</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Create Task</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Create a wedding-wide Task or link it to one Event.</p></div>
        {!events && !error ? <TaskScreenStatus message="Loading Task form…" /> : null}
        {error ? <TaskScreenStatus message={error} retry={() => window.location.reload()} /> : null}
        {events ? <TaskForm events={events} initialValues={{ eventId: initialEventId ?? "" }} managementType={wedding.managementType} mode="create" onCancel={() => router.push(returnPath)} onSubmit={submit} /> : null}
      </main>
    </WeddingWorkspaceShell>
  );
}

export function TaskScreenStatus({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={retry} type="button">Try again</button> : null}</section>;
}
