import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { WeddingOnboarding } from "@/components/weddings/onboarding/wedding-onboarding";

export const metadata: Metadata = {
  title: "Create a wedding | Make My Marriage",
  description: "Create a Make My Marriage wedding planning workspace.",
};

export default function NewWeddingPage() {
  return <AuthenticatedOnly returnTo="/weddings/new"><WeddingOnboarding /></AuthenticatedOnly>;
}

