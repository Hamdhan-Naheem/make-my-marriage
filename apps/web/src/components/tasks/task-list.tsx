"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { WeddingEvent, WeddingTask } from "@make-my-marriage/shared";

export function TaskList({ busyTaskId, emptyMessage, events, onDelete, onToggleStatus, returnTo, tasks, weddingId }: {
  busyTaskId?: string;
  emptyMessage: string;
  events: WeddingEvent[];
  onDelete: (task: WeddingTask) => void;
  onToggleStatus: (task: WeddingTask) => void;
  returnTo: string;
  tasks: WeddingTask[];
  weddingId: string;
}) {
  if (tasks.length === 0) return <div className="rounded-2xl border border-dashed border-[#d9c9ca] bg-[#fcf9f8] px-5 py-10 text-center text-sm text-[#665456]">{emptyMessage}</div>;
  const eventNames = new Map(events.map((event) => [event.id, event.name]));
  return (
    <ul className="space-y-3" aria-label="Wedding tasks">
      {tasks.map((task) => {
        const completed = task.status === "COMPLETED";
        const busy = busyTaskId === task.id;
        return (
          <li className={`rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${completed ? "border-[#ded8d4] opacity-80" : "border-[#e8dfd8] hover:border-[#c47a68]"}`} key={task.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <button aria-label={`${completed ? "Reopen" : "Complete"} ${task.name}`} className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] ${completed ? "border-[#852c3a] bg-[#852c3a] text-white" : "border-[#b9aaaa] bg-white text-transparent hover:border-[#852c3a]"}`} disabled={busy} onClick={() => onToggleStatus(task)} type="button">✓</button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className={`font-bold text-[#302526] ${completed ? "line-through decoration-[#887273]" : ""}`}>{task.name}</h3><TaskBadge>{sideLabel(task.side)}</TaskBadge><TaskBadge tone={completed ? "muted" : "active"}>{completed ? "Completed" : "To Do"}</TaskBadge></div>
                  {task.description ? <p className="mt-2 text-sm leading-6 text-[#665456]">{task.description}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#776566]"><span>{task.eventId ? `Event: ${eventNames.get(task.eventId) ?? "Linked Event"}` : "Wedding-wide"}</span><span>{task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : "No due date"}</span></div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 pl-9 sm:pl-0">
                {busy ? <span aria-live="polite" className="px-2 text-xs font-semibold text-[#776566]">Saving…</span> : null}
                <Link className="rounded-lg px-3 py-2 text-xs font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={`/weddings/${weddingId}/tasks/${task.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}>Edit</Link>
                <button className="rounded-lg px-3 py-2 text-xs font-bold text-[#a22531] hover:bg-[#fff2f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a22531]" disabled={busy} onClick={() => onDelete(task)} type="button">Delete</button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TaskDeleteDialog({ busy, onCancel, onConfirm, task }: { busy: boolean; onCancel: () => void; onConfirm: () => void; task?: WeddingTask }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (task && !dialog.open) dialog.showModal();
    if (!task && dialog.open) dialog.close();
  }, [task]);
  return (
    <dialog aria-labelledby="delete-task-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-0 text-[#1b1c1c] shadow-2xl backdrop:bg-black/35" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} ref={dialogRef}>
      <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a22531]">Delete Task</p><h2 className="mt-2 text-xl font-bold" id="delete-task-title">Delete {task?.name}?</h2><p className="mt-3 text-sm leading-6 text-[#665456]">This permanently removes the Task. The linked Event and other wedding information will remain unchanged.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" disabled={busy} onClick={onCancel} type="button">Cancel</button><button className="rounded-xl bg-[#a22531] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#7f1824] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a22531] disabled:opacity-60" disabled={busy} onClick={onConfirm} type="button">{busy ? "Deleting…" : "Delete Task"}</button></div></div>
    </dialog>
  );
}

export function formatTaskDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function sideLabel(side: WeddingTask["side"]) {
  return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side";
}

function TaskBadge({ children, tone = "side" }: { children: ReactNode; tone?: "active" | "muted" | "side" }) {
  const colors = tone === "active" ? "bg-[#f4e8e5] text-[#852c3a]" : tone === "muted" ? "bg-[#eae7e7] text-[#665456]" : "bg-[#ffdad2] text-[#703628]";
  return <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${colors}`}>{children}</span>;
}
