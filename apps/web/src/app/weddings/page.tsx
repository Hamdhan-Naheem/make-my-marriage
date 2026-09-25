import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { WeddingEntry } from "@/components/weddings/wedding-entry";

export const metadata: Metadata = { title: "Wedding workspaces | Make My Marriage" };

export default function WeddingsPage() {
  return <AuthenticatedOnly returnTo="/weddings"><WeddingEntry /></AuthenticatedOnly>;
}

