import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <AuthCard description="Create an account for Make My Marriage. Wedding creation will be available after authentication is connected." title="Create your account"><RegisterForm /></AuthCard>;
}
