import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { EventsWeddingGate } from "@/components/events/events-wedding-gate";

export const metadata: Metadata = { title: "Wedding events | Make My Marriage" };

export default async function EventsPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const returnTo = `/weddings/${weddingId}/events`;
  return <AuthenticatedOnly returnTo={returnTo}><EventsWeddingGate returnTo={returnTo} view="overview" weddingId={weddingId} /></AuthenticatedOnly>;
}
