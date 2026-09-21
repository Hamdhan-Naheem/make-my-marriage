type AuthFormStatusProps = { message?: string };

export function AuthFormStatus({ message }: AuthFormStatusProps) {
  if (!message) return null;

  return <p aria-live="polite" className="mt-4 rounded-xl border border-[#852c3a]/20 bg-[#fdf6f4] px-3 py-2.5 text-sm font-medium leading-5 text-[#671525]" role="status">{message}</p>;
}
