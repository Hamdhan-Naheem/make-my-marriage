"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { WeddingDashboardEmpty } from "@/components/weddings/dashboard/wedding-dashboard-empty";
import { ApiError, getWedding } from "@/lib/api";
import { clearCurrentWeddingId, setCurrentWeddingId } from "@/lib/wedding-selection";
import { useAppSelector } from "@/store/hooks";

export function WeddingDashboard({ weddingId }: { weddingId: string }) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [wedding, setWedding] = useState<WeddingWorkspace>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    getWedding(weddingId)
      .then((result) => {
        if (!active) return;
        setCurrentWeddingId(result.id);
        setWedding(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          clearCurrentWeddingId();
          router.replace("/weddings");
          return;
        }
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace(`/login?returnTo=${encodeURIComponent(`/weddings/${weddingId}`)}`);
          return;
        }
        setError("This wedding workspace could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [router, weddingId]);

  if (!user || !wedding) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center"><p aria-live="polite" className="text-sm text-[#665456]">{error ?? "Loading your wedding workspace…"}</p>{error ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white" onClick={() => window.location.reload()} type="button">Try again</button> : null}</div></main>;
  }

  return <WeddingDashboardEmpty data={{ weddingId: wedding.id, workspaceName: wedding.name, brideName: wedding.brideName, groomName: wedding.groomName, managementType: wedding.managementType, creatorSide: wedding.member.side, mainWeddingDate: wedding.mainWeddingDate ?? undefined, ownerName: [user.firstName, user.lastName].filter(Boolean).join(" "), memberRole: wedding.member.role }} onCreateEvent={() => router.push(`/weddings/${wedding.id}/events/new`)} />;
}
