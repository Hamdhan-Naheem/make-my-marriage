import { AuthCard } from "@/components/auth/auth-card";
import { GuestOnly } from "@/components/auth/guest-only";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <GuestOnly><AuthCard description="Create your Make My Marriage account. Email verification will be connected in the next authentication milestone." notice="Registration creates an unverified account. Verification email delivery is not connected yet." title="Create your account"><RegisterForm /></AuthCard></GuestOnly>;
}
