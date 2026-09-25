"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { EyeIcon, EyeOffIcon } from "./input-icons";

type PasswordFieldProps = {
  autoComplete: "current-password" | "new-password";
  error?: string;
  id: string;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
};

export function PasswordField({ autoComplete, error, id, label, placeholder, registration }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="block text-sm font-bold text-[#3e3031]" htmlFor={id}>{label}</label>
      <div className="relative mt-2">
        <input aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)} autoComplete={autoComplete} className="w-full rounded-xl border border-[#d9ceca] bg-white py-3 pl-3.5 pr-12 text-sm text-[#1b1c1c] outline-none transition placeholder:text-[#998788] focus:border-[#852c3a] focus:ring-3 focus:ring-[#852c3a]/15 aria-[invalid=true]:border-[#a32d3c] aria-[invalid=true]:focus:ring-[#a32d3c]/15" id={id} placeholder={placeholder} type={isVisible ? "text" : "password"} {...registration} />
        <button aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={isVisible} className="absolute inset-y-1 right-1 flex size-10 items-center justify-center rounded-lg text-[#7f2736] transition hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#852c3a]" onClick={() => setIsVisible((visible) => !visible)} type="button">
          {isVisible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-sm font-medium text-[#a32d3c]" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
