import Link from "next/link";

type AccountLinkProps = {
  className?: string;
  href: "/login" | "/register";
  label: string;
};

export function AccountLink({ className = "", href, label }: AccountLinkProps) {
  return <Link className={`rounded-lg px-4 py-2 text-sm font-semibold ${className}`} href={href}>{label}</Link>;
}
