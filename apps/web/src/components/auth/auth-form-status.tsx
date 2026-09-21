type AuthFormStatusProps = {
  message?: string;
  tone?: "error" | "success";
};

export function AuthFormStatus({ message, tone = "error" }: AuthFormStatusProps) {
  if (!message) return null;

  const colors = tone === "success"
    ? "border-[#4f7555]/25 bg-[#f3f8f3] text-[#315337]"
    : "border-[#a32d3c]/25 bg-[#fdf6f4] text-[#7b2030]";

  return <p aria-live="polite" className={`mt-4 rounded-xl border px-3 py-2.5 text-sm font-medium leading-5 ${colors}`} role={tone === "error" ? "alert" : "status"}>{message}</p>;
}
