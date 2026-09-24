"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { TaskStatus, WeddingEvent, WeddingSide, WeddingTask } from "@make-my-marriage/shared";
import { TaskDeleteDialog, TaskList } from "@/components/tasks/task-list";
import type { TaskWeddingContext } from "@/components/tasks/task-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { deleteTask, listEvents, listTasks, updateTask } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

type FilterValue<T extends string> = "ALL" | T;

export function TaskPlanner({ context }: { context: TaskWeddingContext }) {
  const { wedding, ownerName } = context;
  const returnTo = `/weddings/${wedding.id}/tasks`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const allowedSides: WeddingSide[] = wedding.managementType === "JOINT" ? ["BRIDE", "GROOM", "BOTH"] : [wedding.managementType === "BRIDE_SIDE" ? "BRIDE" : "GROOM"];
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<WeddingTask[]>();
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<FilterValue<TaskStatus>>("ALL");
  const [sideFilter, setSideFilter] = useState<FilterValue<WeddingSide>>("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string>();
  const [eventsError, setEventsError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyTaskId, setBusyTaskId] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] = useState<WeddingTask>();

  const loadTasks = useCallback(async () => {
    try {
      const result = await listTasks(wedding.id, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        side: sideFilter === "ALL" ? undefined : sideFilter,
        eventId: eventFilter === "ALL" ? undefined : eventFilter,
        page,
        limit: 20,
      });
      setTasks(result.tasks);
      setMeta(result.meta);
      setError(undefined);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("Tasks could not be loaded. Please try again.");
    }
  }, [eventFilter, handleTerminalAuth, page, sideFilter, statusFilter, wedding.id]);

  useEffect(() => {
    let active = true;
    listEvents(wedding.id)
      .then((items) => { if (active) { setEvents(items); setEventsError(undefined); } })
      .catch((requestError: unknown) => { if (active && !handleTerminalAuth(requestError)) setEventsError("Event names and the Event filter could not be loaded. Reload the page to try again."); });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.id]);

  useEffect(() => {
    let active = true;
    listTasks(wedding.id, {
      status: statusFilter === "ALL" ? undefined : statusFilter,
      side: sideFilter === "ALL" ? undefined : sideFilter,
      eventId: eventFilter === "ALL" ? undefined : eventFilter,
      page,
      limit: 20,
    }).then((result) => {
      if (!active) return;
      setTasks(result.tasks);
      setMeta(result.meta);
      setError(undefined);
    }).catch((requestError: unknown) => {
      if (active && !handleTerminalAuth(requestError)) setError("Tasks could not be loaded. Please try again.");
    });
    return () => { active = false; };
  }, [eventFilter, handleTerminalAuth, page, sideFilter, statusFilter, wedding.id]);

  function updateFilter(change: () => void) {
    setPage(1);
    setTasks(undefined);
    setNotice(undefined);
    setError(undefined);
    change();
  }

  async function toggleStatus(task: WeddingTask) {
    setBusyTaskId(task.id);
    setNotice(undefined);
    try {
      const updated = await updateTask(wedding.id, task.id, { status: task.status === "COMPLETED" ? "TO_DO" : "COMPLETED" });
      setNotice(updated.status === "COMPLETED" ? `${updated.name} completed.` : `${updated.name} reopened.`);
      await loadTasks();
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Task status could not be updated. Please try again.");
    } finally { setBusyTaskId(undefined); }
  }

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setBusyTaskId(deleteCandidate.id);
    try {
      await deleteTask(wedding.id, deleteCandidate.id);
      setNotice(`${deleteCandidate.name} was deleted.`);
      setDeleteCandidate(undefined);
      if (tasks?.length === 1 && page > 1) setPage((value) => value - 1);
      else await loadTasks();
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Task could not be deleted. Please try again.");
    } finally { setBusyTaskId(undefined); }
  }

  return (
    <WeddingWorkspaceShell activeItem="Tasks" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Wedding planning</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Task Planner</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#665456]">Manage wedding-wide preparation and work linked to individual Events.</p></div><Link className="inline-flex w-full items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" href={`${returnTo}/new`}>+ Create Task</Link></div>

        <section aria-label="Task filters" className="mt-7 rounded-2xl border border-[#e8dfd8] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <FilterSelect label="Status" onChange={(value) => updateFilter(() => setStatusFilter(value as FilterValue<TaskStatus>))} value={statusFilter}><option value="ALL">All statuses</option><option value="TO_DO">To Do</option><option value="COMPLETED">Completed</option></FilterSelect>
            <FilterSelect label="Side" onChange={(value) => updateFilter(() => setSideFilter(value as FilterValue<WeddingSide>))} value={sideFilter}><option value="ALL">All sides</option>{allowedSides.map((side) => <option key={side} value={side}>{side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side"}</option>)}</FilterSelect>
            <FilterSelect label="Event" onChange={(value) => updateFilter(() => setEventFilter(value))} value={eventFilter}><option value="ALL">All tasks</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</FilterSelect>
          </div>
        </section>

        {notice ? <p aria-live="polite" className="mt-5 rounded-xl border border-[#d9c9ca] bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#671525]">{notice}</p> : null}
        {eventsError ? <p className="mt-5 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-3 text-sm text-[#8b1f2d]" role="alert">{eventsError}</p> : null}
        {!tasks && !error ? <PlannerStatus message="Loading wedding Tasks…" /> : null}
        {error ? <PlannerStatus message={error} retry={() => window.location.reload()} /> : null}
        {tasks ? <section className="mt-6" aria-labelledby="task-results-title"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold" id="task-results-title">Tasks</h2><p className="text-xs font-semibold text-[#776566]">{meta.total} {meta.total === 1 ? "Task" : "Tasks"}</p></div><TaskList busyTaskId={busyTaskId} emptyMessage="No Tasks match these filters. Create a Task or change the filters." events={events} onDelete={setDeleteCandidate} onToggleStatus={toggleStatus} returnTo={returnTo} tasks={tasks} weddingId={wedding.id} />{meta.totalPages > 1 ? <nav aria-label="Task pages" className="mt-6 flex items-center justify-between"><button className="rounded-lg border border-[#d9c9ca] bg-white px-4 py-2 text-sm font-bold text-[#554243] disabled:opacity-45" disabled={page <= 1} onClick={() => { setTasks(undefined); setPage((value) => value - 1); }} type="button">Previous</button><span className="text-xs font-semibold text-[#776566]">Page {meta.page} of {meta.totalPages}</span><button className="rounded-lg border border-[#d9c9ca] bg-white px-4 py-2 text-sm font-bold text-[#554243] disabled:opacity-45" disabled={page >= meta.totalPages} onClick={() => { setTasks(undefined); setPage((value) => value + 1); }} type="button">Next</button></nav> : null}</section> : null}
      </main>
      <TaskDeleteDialog busy={Boolean(deleteCandidate && busyTaskId === deleteCandidate.id)} onCancel={() => setDeleteCandidate(undefined)} onConfirm={() => void confirmDelete()} task={deleteCandidate} />
    </WeddingWorkspaceShell>
  );
}

function FilterSelect({ children, label, onChange, value }: { children: React.ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  const id = `task-filter-${label.toLowerCase()}`;
  return <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#776566]" htmlFor={id}>{label}</label><select className="w-full rounded-lg border border-[#ded3d1] bg-[#fcf9f8] px-3 py-2.5 text-sm focus:border-[#852c3a] focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20" id={id} onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></div>;
}

function PlannerStatus({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-10 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={retry} type="button">Try again</button> : null}</section>;
}
