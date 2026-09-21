import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

type AuthCardProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthCard({ children, description, title }: AuthCardProps) {
  return (
    <section aria-labelledby="auth-title" className="mx-auto w-full max-w-md rounded-3xl border border-[#e8dfd8] bg-white p-6 shadow-[0_24px_56px_-32px_rgba(103,21,37,0.42)] sm:p-8">
      <div className="flex justify-center"><BrandMark compact /></div>
      <div className="mt-5 text-center">
        <h1 className="text-2xl font-bold tracking-[-0.035em] text-[#1b1c1c]" id="auth-title">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#554243]">{description}</p>
      </div>
      <p className="mt-5 rounded-xl border border-[#e8dfd8] bg-[#fdf6f4] px-3 py-2.5 text-sm leading-5 text-[#6c3a40]" role="note">
        Authentication is not connected yet. You can explore this form and its client-side validation.
      </p>
      {children}
    </section>
  );
}
