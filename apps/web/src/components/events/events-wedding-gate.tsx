"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { EventCreateScreen } from "@/components/events/event-create-screen";
import { EventDetailsScreen } from "@/components/events/event-details-screen";
import { EventEditScreen } from "@/components/events/event-edit-screen";
import { EventsOverview } from "@/components/events/events-overview";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getWedding } from "@/lib/api";
import { clearCurrentWeddingId, setCurrentWeddingId } from "@/lib/wedding-selection";
import { signedOut } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export type EventsWeddingContext = {
  wedding: WeddingWorkspace;
  ownerName: string;
};

type EventsWeddingGateProps = {
  returnTo: string;
  weddingId: string;
} & (
  | { view: "overview" | "create"; eventId?: never }
  | { view: "details" | "edit"; eventId: string }
);

export function EventsWeddingGate({ eventId, returnTo, view, weddingId }: EventsWeddingGateProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
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
        if (requestError instanceof ApiError && requestError.status === 401) {
          dispatch(signedOut());
          router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        setRequestState({ weddingId, error: "This wedding workspace could not be loaded. Please try again." });
      });
    return () => { active = false; };
  }, [dispatch, returnTo, router, weddingId]);

  if (!user || !wedding) return <CenteredEventStatus error={error} />;

  const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (wedding.member.role !== "OWNER") {
    return (
      <WeddingWorkspaceShell activeItem="Events" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center shadow-sm" aria-labelledby="events-access-title">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Events access</p>
            <h1 className="mt-2 text-2xl font-bold" id="events-access-title">Owner access is required</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#665456]">This first Events milestone is available only to active Owners. Access for other wedding roles will be added with the approved permission and assignment infrastructure.</p>
          </section>
        </main>
      </WeddingWorkspaceShell>
    );
  }

  const context = { wedding, ownerName };

  switch (view) {
    case "overview":
      return <EventsOverview context={context} />;
    case "create":
      return <EventCreateScreen context={context} />;
    case "details":
      return <EventDetailsScreen context={context} eventId={eventId} />;
    case "edit":
      return <EventEditScreen context={context} eventId={eventId} />;
  }
}

function CenteredEventStatus({ error }: { error?: string }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="w-full max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center shadow-sm"><div aria-hidden="true" className="mx-auto size-10 animate-pulse rounded-full bg-[#f4e8e5]" /><p aria-live="polite" className="mt-4 text-sm text-[#665456]">{error ?? "Loading wedding events…"}</p>{error ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => window.location.reload()} type="button">Try again</button> : null}</div></main>;
}
