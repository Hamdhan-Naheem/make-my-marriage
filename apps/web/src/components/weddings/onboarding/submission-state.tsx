type SubmissionState = "idle" | "loading" | "pending" | "error" | "success";

const stateStyles: Record<Exclude<SubmissionState, "idle">, string> = {
  loading: "border-[#dbc0c1] bg-[#f6f3f2] text-[#554243]",
  pending: "border-[#e1c4ad] bg-[#fff6ed] text-[#70452d]",
  error: "border-[#efb8b3] bg-[#fff1f0] text-[#7b2030]",
  success: "border-[#bad9c6] bg-[#effaf3] text-[#245c39]",
};

export function OnboardingSubmissionState({ state, message }: { state: SubmissionState; message?: string }) {
  if (state === "idle") return null;

  const defaultMessage = {
    loading: "Creating your wedding workspace…",
    pending: "Wedding creation is waiting for backend integration. Your details remain available in this form.",
    error: "The wedding could not be created. Review your details and try again.",
    success: "Your wedding workspace has been created.",
  }[state];

  return (
    <div
      aria-live="polite"
      className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${stateStyles[state]}`}
      role={state === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className="mt-0.5 font-bold">{state === "loading" ? "…" : state === "success" ? "✓" : "i"}</span>
      <p>{message ?? defaultMessage}</p>
    </div>
  );
}

