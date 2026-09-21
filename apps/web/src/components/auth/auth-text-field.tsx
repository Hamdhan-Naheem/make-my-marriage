import type { InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { MailIcon, PersonIcon } from "./input-icons";

type AuthTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type"> & {
  error?: string;
  id: string;
  icon: "email" | "person";
  label: string;
  registration: UseFormRegisterReturn;
  type?: "email" | "text";
};

export function AuthTextField({ error, icon, id, label, registration, type = "text", ...inputProps }: AuthTextFieldProps) {
  const errorId = `${id}-error`;
  const InputIcon = icon === "email" ? MailIcon : PersonIcon;

  return (
    <div>
      <label className="block text-sm font-bold text-[#3e3031]" htmlFor={id}>{label}</label>
      <div className="relative mt-2">
        <input aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)} className="w-full rounded-xl border border-[#d9ceca] bg-white py-3 pl-3.5 pr-11 text-sm text-[#1b1c1c] outline-none transition placeholder:text-[#998788] focus:border-[#852c3a] focus:ring-3 focus:ring-[#852c3a]/15 aria-[invalid=true]:border-[#a32d3c] aria-[invalid=true]:focus:ring-[#a32d3c]/15" id={id} type={type} {...inputProps} {...registration} />
        <InputIcon className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-[#8f7074]" />
      </div>
      {error ? <p className="mt-1.5 text-sm font-medium text-[#a32d3c]" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
