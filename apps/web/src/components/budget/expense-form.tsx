"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { WeddingCurrency, WeddingEvent, WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { ApiError } from "@/lib/api";
import { allowedExpenseSides, expenseFormSchema, weddingExpenseSide, type ExpenseFormValues } from "@/lib/validation/expense-schema";

const inputClass = "w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 py-2.5 text-sm text-[#302526] transition placeholder:text-[#998889] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20";
const fieldNames = ["name", "description", "amount", "side", "expenseDate", "category", "eventId"] as const;
const sideOptions: Array<{ value: WeddingSide; label: string }> = [
  { value: "BRIDE", label: "Bride Side" },
  { value: "GROOM", label: "Groom Side" },
  { value: "BOTH", label: "Both Sides" },
];

export function ExpenseForm({ currency, events, initialEventId, initialValues, managementType, mode, onCancel, onSubmit }: {
  currency: WeddingCurrency;
  events: WeddingEvent[];
  initialEventId?: string;
  initialValues?: Partial<ExpenseFormValues>;
  managementType: WeddingManagementType;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}) {
  const fixedWeddingSide = weddingExpenseSide(managementType);
  const [submissionError, setSubmissionError] = useState<string>();
  const { control, formState: { errors, isSubmitting }, handleSubmit, register, setError, setValue } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      amount: initialValues?.amount ?? "",
      side: fixedWeddingSide ?? initialValues?.side,
      expenseDate: initialValues?.expenseDate ?? "",
      category: initialValues?.category ?? "",
      eventId: initialValues?.eventId ?? initialEventId ?? "",
    },
  });
  const selectedEventId = useWatch({ control, name: "eventId" });
  const selectedSide = useWatch({ control, name: "side" });
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);
  const allowedSides = allowedExpenseSides(managementType, selectedEvent?.side);

  useEffect(() => {
    if (allowedSides.length === 1 && selectedSide !== allowedSides[0]) {
      setValue("side", allowedSides[0], { shouldDirty: true, shouldValidate: true });
    }
  }, [allowedSides, selectedSide, setValue]);

  const submit = handleSubmit(async (values) => {
    if (!allowedSides.includes(values.side)) {
      setError("side", { type: "validate", message: "Choose a side compatible with the selected Event." });
      return;
    }
    setSubmissionError(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (fieldNames.includes(field as typeof fieldNames[number]) && messages[0]) setError(field as typeof fieldNames[number], { type: "server", message: messages[0] });
        }
      }
      setSubmissionError(error instanceof ApiError ? error.message : "The Expense could not be saved. Please try again.");
    }
  });

  return <form className="rounded-2xl border border-[#eee6e2] bg-white p-4 shadow-sm sm:p-6 lg:p-8" noValidate onChange={() => setSubmissionError(undefined)} onSubmit={submit}>
    <div className="space-y-8">
      <section aria-labelledby="expense-details-heading">
        <SectionHeading id="expense-details-heading" number="1" title="Expense Details" />
        <div className="mt-4 grid gap-5">
          <Field count={`${name?.length ?? 0} / 140`} error={errors.name?.message} htmlFor="expense-name" label="Expense name" required><input aria-invalid={Boolean(errors.name)} className={inputClass} id="expense-name" maxLength={140} placeholder="e.g. Ceremony decorations" {...register("name")} /></Field>
          <Field count={`${description?.length ?? 0} / 1,000`} error={errors.description?.message} htmlFor="expense-description" label="Description" optional><textarea aria-invalid={Boolean(errors.description)} className={`${inputClass} min-h-24 resize-y`} id="expense-description" maxLength={1000} placeholder="Add helpful details" rows={4} {...register("description")} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field error={errors.amount?.message} htmlFor="expense-amount" label={`Amount (${currency})`} required><input aria-invalid={Boolean(errors.amount)} className={inputClass} id="expense-amount" inputMode="decimal" placeholder="0.00" {...register("amount")} /><p className="mt-1.5 text-xs text-[#776566]">Use up to 2 decimal places. Spending above a budget is allowed and shown as a warning.</p></Field>
            <Field error={errors.expenseDate?.message} htmlFor="expense-date" label="Expense date" optional><input aria-invalid={Boolean(errors.expenseDate)} className={inputClass} id="expense-date" type="date" {...register("expenseDate")} /></Field>
          </div>
          <Field error={errors.category?.message} htmlFor="expense-category" label="Category" optional><input aria-invalid={Boolean(errors.category)} className={inputClass} id="expense-category" maxLength={100} placeholder="e.g. Decorations" {...register("category")} /></Field>
        </div>
      </section>

      <div className="h-px bg-[#eee6e2]" />

      <section aria-labelledby="expense-context-heading">
        <SectionHeading id="expense-context-heading" number="2" title="Wedding Context" />
        <div className="mt-4 grid gap-5">
          <Field error={errors.eventId?.message} htmlFor="expense-event" label="Related Event" optional>
            <select aria-invalid={Boolean(errors.eventId)} className={inputClass} id="expense-event" {...register("eventId")}><option value="">Wedding-wide Expense</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name} · {sideLabel(event.side)}</option>)}</select>
            <p className="mt-1.5 text-xs text-[#776566]">Event-linked Expenses count once in the Wedding total and also in that Event&apos;s spending.</p>
          </Field>
          <fieldset>
            <legend className="text-sm font-semibold text-[#302526]">Expense Side <span className="text-[#852c3a]">*</span></legend>
            {allowedSides.length === 1 ? <div className="mt-3 rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] p-4"><input type="hidden" value={allowedSides[0]} {...register("side")} /><p className="text-sm font-bold text-[#671525]">{sideLabel(allowedSides[0])}</p><p className="mt-1 text-xs text-[#665456]">{selectedEvent ? "The selected Event fixes the compatible Expense Side." : "This wedding type fixes the Expense Side."}</p></div> : <div className="mt-3 grid gap-3 sm:grid-cols-3">{sideOptions.filter((option) => allowedSides.includes(option.value)).map((option) => <label className={`cursor-pointer rounded-xl border p-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#852c3a] ${selectedSide === option.value ? "border-[#852c3a] bg-[#fff7f6]" : "border-[#ded3d1]"}`} key={option.value}><input className="sr-only" type="radio" value={option.value} {...register("side")} /><span aria-hidden="true" className={`mb-3 flex size-8 items-center justify-center rounded-full border-2 ${selectedSide === option.value ? "border-[#852c3a] bg-[#852c3a] text-white" : "border-[#c9bcbc] text-transparent"}`}>✓</span><strong className="text-sm">{option.label}</strong></label>)}</div>}
            <FieldError id="expense-side-error" message={errors.side?.message} />
          </fieldset>
        </div>
      </section>
    </div>
    {submissionError ? <p className="mt-8 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-3 text-sm text-[#8b1f2d]" role="alert">{submissionError}</p> : null}
    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="min-h-12 rounded-xl px-5 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] disabled:opacity-60" disabled={isSubmitting} onClick={onCancel} type="button">Cancel</button><button className="min-h-12 rounded-xl bg-[#852c3a] px-6 text-sm font-bold text-white hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? (mode === "create" ? "Adding Expense…" : "Saving Changes…") : (mode === "create" ? "Add Expense" : "Save Changes")}</button></div>
  </form>;
}

function SectionHeading({ id, number, title }: { id: string; number: string; title: string }) {
  return <div className="flex items-center gap-2"><span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-[#ffdad2] text-xs font-bold text-[#703628]">{number}</span><h2 className="text-base font-bold text-[#302526]" id={id}>{title}</h2></div>;
}
function Field({ children, count, error, htmlFor, label, optional, required }: { children: ReactNode; count?: string; error?: string; htmlFor: string; label: string; optional?: boolean; required?: boolean }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-sm font-semibold text-[#302526]" htmlFor={htmlFor}>{label}{required ? <span className="ml-1 text-[#852c3a]">*</span> : null}{optional ? <span className="ml-1 font-normal text-[#776566]">(Optional)</span> : null}</label>{count ? <span className="text-xs text-[#887273]">{count}</span> : null}</div>{children}<FieldError id={`${htmlFor}-error`} message={error} /></div>;
}
function FieldError({ id, message }: { id: string; message?: string }) { return message ? <p className="mt-1.5 text-xs font-semibold text-[#a22531]" id={id} role="alert">{message}</p> : null; }
function sideLabel(side: WeddingSide) { return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side"; }
