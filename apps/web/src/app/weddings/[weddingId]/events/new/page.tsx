import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { EventsWeddingGate } from "@/components/events/events-wedding-gate";

export const metadata: Metadata = { title: "Create event | Make My Marriage" };

export default async function CreateEventPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const returnTo = `/weddings/${weddingId}/events/new`;
  return <AuthenticatedOnly returnTo={returnTo}><EventsWeddingGate returnTo={returnTo} view="create" weddingId={weddingId} /></AuthenticatedOnly>;
}
