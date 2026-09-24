"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WeddingEvent, WeddingTask } from "@make-my-marriage/shared";
import { TaskDeleteDialog, TaskList } from "@/components/tasks/task-list";
import { deleteTask, listTasks, updateTask } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

export function EventTasksPanel({ event, weddingId }: { event: WeddingEvent; weddingId: string }) {
  const returnTo = `/weddings/${weddingId}/events/${event.id}`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [tasks, setTasks] = useState<WeddingTask[]>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyTaskId, setBusyTaskId] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] = useState<WeddingTask>();

  const load = useCallback(async () => {
    try {
      const result = await listTasks(weddingId, { eventId: event.id, limit: 100 });
      setTasks(result.tasks);
      setError(undefined);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("Linked Tasks could not be loaded. Please try again.");
    }
  }, [event.id, handleTerminalAuth, weddingId]);

  useEffect(() => {
    let active = true;
    listTasks(weddingId, { eventId: event.id, limit: 100 })
      .then((result) => { if (active) { setTasks(result.tasks); setError(undefined); } })
      .catch((requestError: unknown) => {
        if (active && !handleTerminalAuth(requestError)) setError("Linked Tasks could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [event.id, handleTerminalAuth, weddingId]);

  async function toggleStatus(task: WeddingTask) {
    setBusyTaskId(task.id);
    setNotice(undefined);
    try {
      const updated = await updateTask(weddingId, task.id, { status: task.status === "COMPLETED" ? "TO_DO" : "COMPLETED" });
      setTasks((items) => items?.map((item) => item.id === updated.id ? updated : item));
      setNotice(updated.status === "COMPLETED" ? `${updated.name} completed.` : `${updated.name} reopened.`);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Task status could not be updated. Please try again.");
    } finally { setBusyTaskId(undefined); }
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setBusyTaskId(deleteCandidate.id);
    try {
      await deleteTask(weddingId, deleteCandidate.id);
      setTasks((items) => items?.filter((item) => item.id !== deleteCandidate.id));
      setNotice(`${deleteCandidate.name} was deleted.`);
      setDeleteCandidate(undefined);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Task could not be deleted. Please try again.");
    } finally { setBusyTaskId(undefined); }
  }

  const createHref = `/weddings/${weddingId}/tasks/new?eventId=${encodeURIComponent(event.id)}&returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <section aria-labelledby="event-tasks-title" className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Preparation</p><h2 className="mt-2 text-lg font-bold text-[#671525]" id="event-tasks-title">Event Tasks</h2><p className="mt-1 text-sm text-[#665456]">Manage preparation linked only to this Event.</p></div><Link className="inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] sm:w-auto" href={createHref}>+ Add Task</Link></div>
      {notice ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#671525]">{notice}</p> : null}
      {!tasks && !error ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#f6f3f2] px-4 py-6 text-center text-sm text-[#665456]">Loading linked Tasks…</p> : null}
      {error ? <div className="mt-5 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-5 text-center"><p className="text-sm text-[#8b1f2d]" role="alert">{error}</p><button className="mt-3 rounded-lg bg-[#852c3a] px-4 py-2 text-xs font-bold text-white" onClick={() => { setError(undefined); void load(); }} type="button">Try again</button></div> : null}
      {tasks ? <div className="mt-5"><TaskList busyTaskId={busyTaskId} emptyMessage="No Tasks are linked to this Event yet." events={[event]} onDelete={setDeleteCandidate} onToggleStatus={toggleStatus} returnTo={returnTo} tasks={tasks} weddingId={weddingId} /></div> : null}
      <TaskDeleteDialog busy={Boolean(deleteCandidate && busyTaskId === deleteCandidate.id)} onCancel={() => setDeleteCandidate(undefined)} onConfirm={() => void confirmDelete()} task={deleteCandidate} />
    </section>
  );
}
