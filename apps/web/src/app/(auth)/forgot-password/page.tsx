import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return <AuthCard description="Enter your account email and we will prepare a secure reset flow when password recovery is connected." title="Forgot your password?"><ForgotPasswordForm /></AuthCard>;
}
