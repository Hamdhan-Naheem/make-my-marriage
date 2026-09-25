const steps = [
  { number: 1, label: "Wedding setup" },
  { number: 2, label: "Wedding details" },
  { number: 3, label: "Review & create" },
] as const;

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Wedding onboarding progress" className="mx-auto w-full max-w-3xl">
      <ol className="grid grid-cols-3">
        {steps.map((step, index) => {
          const complete = currentStep > step.number;
          const active = currentStep === step.number;
          return (
            <li className="relative flex flex-col items-center text-center" key={step.number}>
              {index > 0 ? <span aria-hidden="true" className={`absolute right-1/2 top-4 h-px w-full ${currentStep > step.number - 1 ? "bg-[#852c3a]" : "bg-[#dbcfd0]"}`} /> : null}
              <span
                aria-current={active ? "step" : undefined}
                className={`relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  complete || active
                    ? "border-[#852c3a] bg-[#852c3a] text-white"
                    : "border-[#cbbabc] bg-[#fcf9f8] text-[#776566]"
                }`}
              >
                {complete ? <span aria-label="Completed">✓</span> : step.number}
              </span>
              <span className={`mt-2 text-[0.68rem] font-semibold sm:text-xs ${active ? "text-[#671525]" : "text-[#776566]"}`}>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

