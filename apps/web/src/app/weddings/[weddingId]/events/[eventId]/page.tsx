import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { EventsWeddingGate } from "@/components/events/events-wedding-gate";

export const metadata: Metadata = { title: "Event details | Make My Marriage" };

export default async function EventDetailsPage({ params }: { params: Promise<{ weddingId: string; eventId: string }> }) {
  const { weddingId, eventId } = await params;
  const returnTo = `/weddings/${weddingId}/events/${eventId}`;
  return <AuthenticatedOnly returnTo={returnTo}><EventsWeddingGate eventId={eventId} returnTo={returnTo} view="details" weddingId={weddingId} /></AuthenticatedOnly>;
}
