"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { TaskCreateScreen } from "@/components/tasks/task-create-screen";
import { TaskEditScreen } from "@/components/tasks/task-edit-screen";
import { TaskPlanner } from "@/components/tasks/task-planner";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getWedding } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { clearCurrentWeddingId, setCurrentWeddingId } from "@/lib/wedding-selection";
import { useAppSelector } from "@/store/hooks";

export type TaskWeddingContext = { wedding: WeddingWorkspace; ownerName: string };

type TaskWeddingGateProps = { returnTo: string; weddingId: string } & (
  | { view: "overview"; taskId?: never; initialEventId?: never; navigationReturnTo?: never }
  | { view: "create"; taskId?: never; initialEventId?: string; navigationReturnTo?: string }
  | { view: "edit"; taskId: string; initialEventId?: never; navigationReturnTo?: string }
);

export function TaskWeddingGate({ initialEventId, navigationReturnTo, returnTo, taskId, view, weddingId }: TaskWeddingGateProps) {
  const router = useRouter();
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const user = useAppSelector((state) => state.auth.user);
  const [requestState, setRequestState] = useState<{ weddingId: string; wedding?: WeddingWorkspace; error?: string }>({ weddingId });
  const wedding = requestState.weddingId === weddingId ? requestState.wedding : undefined;
  const error = requestState.weddingId === weddingId ? requestState.error : undefined;

  useEffect(() => {
    let active = true;
    getWedding(weddingId)
      .then((result) => {
        if (!active) return;
        setCurrentWeddingId(result.id);
        setRequestState({ weddingId, wedding: result });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          clearCurrentWeddingId();
          router.replace("/weddings");
          return;
        }
        if (handleTerminalAuth(requestError)) return;
        setRequestState({ weddingId, error: "This wedding workspace could not be loaded. Please try again." });
      });
    return () => { active = false; };
  }, [handleTerminalAuth, router, weddingId]);

  if (!user || !wedding) return <CenteredTaskStatus error={error} />;
  const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  if (wedding.member.role !== "OWNER") {
    return (
      <WeddingWorkspaceShell activeItem="Tasks" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"><section aria-labelledby="tasks-access-title" className="rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Tasks access</p><h1 className="mt-2 text-2xl font-bold" id="tasks-access-title">Owner access is required</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#665456]">This first Task Planner milestone is available only to active Owners. Other roles will be added with the approved permission and assignment infrastructure.</p></section></main>
      </WeddingWorkspaceShell>
    );
  }

  const context = { wedding, ownerName };
  if (view === "overview") return <TaskPlanner context={context} />;
  if (view === "create") return <TaskCreateScreen context={context} initialEventId={initialEventId} navigationReturnTo={navigationReturnTo} />;
  return <TaskEditScreen context={context} navigationReturnTo={navigationReturnTo} taskId={taskId} />;
}

function CenteredTaskStatus({ error }: { error?: string }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="w-full max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center shadow-sm"><div aria-hidden="true" className="mx-auto size-10 animate-pulse rounded-full bg-[#f4e8e5]" /><p aria-live="polite" className="mt-4 text-sm text-[#665456]">{error ?? "Loading wedding tasks…"}</p>{error ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => window.location.reload()} type="button">Try again</button> : null}</div></main>;
}
