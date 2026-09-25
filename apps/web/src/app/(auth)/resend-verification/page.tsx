import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export default function ResendVerificationPage() {
  return <AuthCard description="Enter your email address to request a fresh verification link." notice="For privacy, the response is the same whether or not an account exists." title="Resend verification email"><ResendVerificationForm /></AuthCard>;
}
