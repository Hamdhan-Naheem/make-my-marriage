"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingEvent, WeddingTask } from "@make-my-marriage/shared";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskScreenStatus } from "@/components/tasks/task-create-screen";
import type { TaskWeddingContext } from "@/components/tasks/task-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getTask, listEvents, updateTask } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { taskToFormValues, toTaskRequest, type TaskFormValues } from "@/lib/validation/task-schema";

export function TaskEditScreen({ context, navigationReturnTo, taskId }: { context: TaskWeddingContext; navigationReturnTo?: string; taskId: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const plannerPath = `/weddings/${wedding.id}/tasks`;
  const returnPath = navigationReturnTo ?? plannerPath;
  const handleTerminalAuth = useTerminalAuthRedirect(`${plannerPath}/${taskId}/edit`);
  const [data, setData] = useState<{ task: WeddingTask; events: WeddingEvent[] }>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([getTask(wedding.id, taskId), listEvents(wedding.id)])
      .then(([task, events]) => { if (active) setData({ task, events }); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        setError(requestError instanceof ApiError && requestError.status === 404 ? "This Task was not found in the selected wedding." : "The Task could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [handleTerminalAuth, taskId, wedding.id]);

  async function submit(values: TaskFormValues) {
    try {
      await updateTask(wedding.id, taskId, toTaskRequest(values));
      router.push(returnPath);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) throw requestError;
    }
  }

  return (
    <WeddingWorkspaceShell activeItem="Tasks" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <button className="rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => router.push(returnPath)} type="button">← Back</button>
        <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Task Planner</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Task</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Update Task details, its optional Event link, or its side.</p></div>
        {!data && !error ? <TaskScreenStatus message="Loading Task…" /> : null}
        {error ? <TaskScreenStatus message={error} retry={() => window.location.reload()} /> : null}
        {data ? <TaskForm events={data.events} initialValues={taskToFormValues(data.task)} managementType={wedding.managementType} mode="edit" onCancel={() => router.push(returnPath)} onSubmit={submit} /> : null}
      </main>
    </WeddingWorkspaceShell>
  );
}
