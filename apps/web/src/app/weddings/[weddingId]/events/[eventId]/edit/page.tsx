import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { EventsWeddingGate } from "@/components/events/events-wedding-gate";

export const metadata: Metadata = { title: "Edit event | Make My Marriage" };

export default async function EditEventPage({ params }: { params: Promise<{ weddingId: string; eventId: string }> }) {
  const { weddingId, eventId } = await params;
  const returnTo = `/weddings/${weddingId}/events/${eventId}/edit`;
  return <AuthenticatedOnly returnTo={returnTo}><EventsWeddingGate eventId={eventId} returnTo={returnTo} view="edit" weddingId={weddingId} /></AuthenticatedOnly>;
}
