"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { eventFormSchema, eventSideForWedding, enforceWeddingEventSide, type EventFormValues } from "@/lib/validation/event-schema";

const sideOptions: Array<{ value: WeddingSide; label: string; description: string }> = [
  { value: "BRIDE", label: "Bride Side", description: "Bride's household event" },
  { value: "GROOM", label: "Groom Side", description: "Groom's household event" },
  { value: "BOTH", label: "Both Sides", description: "Joint celebration" },
];

const inputClass = "w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 py-2.5 text-sm text-[#302526] transition placeholder:text-[#998889] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20";

export function EventForm({ initialValues, managementType, mode, onCancel, preview = false }: { initialValues?: Partial<EventFormValues>; managementType: WeddingManagementType; mode: "create" | "edit"; onCancel: () => void; preview?: boolean }) {
  const fixedSide = eventSideForWedding(managementType);
  const [pendingNotice, setPendingNotice] = useState(false);
  const { control, formState: { errors }, handleSubmit, register, setValue } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      side: fixedSide ?? initialValues?.side,
      eventDate: initialValues?.eventDate ?? "",
      startTime: initialValues?.startTime ?? "",
      endTime: initialValues?.endTime ?? "",
      venueName: initialValues?.venueName ?? "",
      address: initialValues?.address ?? "",
    },
  });
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const selectedSide = useWatch({ control, name: "side" });

  function clearSchedule() {
    setPendingNotice(false);
    setValue("eventDate", "", { shouldDirty: true, shouldValidate: true });
    setValue("startTime", "", { shouldDirty: true, shouldValidate: true });
    setValue("endTime", "", { shouldDirty: true, shouldValidate: true });
  }

  const submit = handleSubmit((values) => {
    const normalizedValues = enforceWeddingEventSide(values, managementType);
    if (normalizedValues.side !== values.side) setValue("side", normalizedValues.side, { shouldValidate: true });
    setPendingNotice(true);
  });

  return (
    <form className="rounded-2xl border border-[#eee6e2] bg-white p-4 shadow-sm sm:p-6 lg:p-8" noValidate onChange={() => setPendingNotice(false)} onSubmit={submit}>
      {preview ? <div className="mb-6 rounded-xl border border-[#e1c4ad] bg-[#fff6ed] px-4 py-3 text-sm leading-6 text-[#70452d]" role="status"><strong>Frontend-only preview.</strong> These values are sample content and are not loaded from or saved to the database.</div> : null}
      <div className="space-y-8">
        <section aria-labelledby="event-details-heading">
          <SectionHeading number="1" title="Event Details" id="event-details-heading" />
          <div className="mt-4 grid gap-5">
            <Field label="Event name" required error={errors.name?.message} count={`${name?.length ?? 0} / 120`} htmlFor="event-name">
              <input aria-describedby={errors.name ? "event-name-error" : "event-name-help"} aria-invalid={Boolean(errors.name)} className={inputClass} id="event-name" maxLength={120} placeholder="Enter a name for this event" {...register("name")} />
              {!errors.name ? <p className="mt-1.5 text-xs text-[#776566]" id="event-name-help">Use any custom name that fits your celebration.</p> : null}
            </Field>
            <Field label="Description" optional error={errors.description?.message} count={`${description?.length ?? 0} / 1,000`} htmlFor="event-description">
              <textarea aria-describedby={errors.description ? "event-description-error" : undefined} aria-invalid={Boolean(errors.description)} className={`${inputClass} min-h-24 resize-y`} id="event-description" maxLength={1000} placeholder="Add a short description" rows={4} {...register("description")} />
            </Field>
          </div>
        </section>

        <div className="h-px bg-[#eee6e2]" />

        <section aria-labelledby="event-side-heading">
          <SectionHeading number="2" title="Event Side" required id="event-side-heading" />
          {fixedSide ? (
            <div className="mt-4 rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] p-4">
              <input type="hidden" value={fixedSide} {...register("side")} />
              <p className="text-sm font-bold text-[#671525]">{fixedSide === "BRIDE" ? "Bride Side" : "Groom Side"}</p>
              <p className="mt-1 text-xs leading-5 text-[#665456]">This wedding type fixes every event to the {fixedSide === "BRIDE" ? "bride" : "groom"} side. The backend will enforce the same rule when integration is added.</p>
            </div>
          ) : (
            <fieldset className="mt-4">
              <legend className="text-sm text-[#665456]">Choose which side this event belongs to.</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {sideOptions.map((option) => (
                  <label className={`relative cursor-pointer rounded-xl border p-4 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#852c3a] ${selectedSide === option.value ? "border-[#852c3a] bg-[#fff7f6] shadow-sm" : "border-[#ded3d1] bg-white hover:border-[#c47a68]"}`} key={option.value}>
                    <input aria-describedby={errors.side ? "event-side-error" : undefined} className="peer sr-only" type="radio" value={option.value} {...register("side")} />
                    <span aria-hidden="true" className={`mb-3 flex size-8 items-center justify-center rounded-full border-2 ${selectedSide === option.value ? "border-[#852c3a] bg-[#852c3a] text-white" : "border-[#c9bcbc] text-transparent"}`}>✓</span>
                    <strong className="block text-sm text-[#302526]">{option.label}</strong>
                    <span className="mt-1 block text-xs text-[#776566]">{option.description}</span>
                  </label>
                ))}
              </div>
              <FieldError id="event-side-error" message={errors.side?.message} />
            </fieldset>
          )}
        </section>

        <div className="h-px bg-[#eee6e2]" />

        <section aria-labelledby="event-schedule-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading number="3" title="Schedule" optional id="event-schedule-heading" />
            <button className="rounded-lg px-2 py-1.5 text-xs font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={clearSchedule} type="button">We haven&apos;t decided yet</button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Event date" error={errors.eventDate?.message} htmlFor="event-date"><input aria-describedby={errors.eventDate ? "event-date-error" : undefined} aria-invalid={Boolean(errors.eventDate)} className={inputClass} id="event-date" type="date" {...register("eventDate")} /></Field>
            <Field label="Start time" error={errors.startTime?.message} htmlFor="start-time"><input aria-describedby={errors.startTime ? "start-time-error" : undefined} aria-invalid={Boolean(errors.startTime)} className={inputClass} id="start-time" type="time" {...register("startTime")} /></Field>
            <Field label="End time" error={errors.endTime?.message} htmlFor="end-time"><input aria-describedby={errors.endTime ? "end-time-error" : undefined} aria-invalid={Boolean(errors.endTime)} className={inputClass} id="end-time" type="time" {...register("endTime")} /></Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#776566]">Times require an event date. End time is optional, but when provided it must be later than the start time on the same day.</p>
        </section>

        <div className="h-px bg-[#eee6e2]" />

        <section aria-labelledby="event-location-heading">
          <SectionHeading number="4" title="Location" optional id="event-location-heading" />
          <div className="mt-4 grid gap-4">
            <Field label="Venue name" error={errors.venueName?.message} htmlFor="venue-name"><input aria-describedby={errors.venueName ? "venue-name-error" : undefined} aria-invalid={Boolean(errors.venueName)} className={inputClass} id="venue-name" maxLength={160} placeholder="Enter the venue name" {...register("venueName")} /></Field>
            <Field label="Address or detailed location" error={errors.address?.message} htmlFor="event-address"><input aria-describedby={errors.address ? "event-address-error" : undefined} aria-invalid={Boolean(errors.address)} className={inputClass} id="event-address" maxLength={500} placeholder="Enter the venue address or location" {...register("address")} /></Field>
          </div>
        </section>
      </div>

      <div className="mt-8 rounded-xl border border-[#e1c4ad] bg-[#fffaf5] px-4 py-3 text-xs leading-5 text-[#70452d]">Backend integration is pending. Submitting this form validates the fields but does not create or update an Event.</div>
      {pendingNotice ? <p className="mt-4 rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] px-4 py-3 text-sm text-[#671525]" role="status">The form is valid, but Event persistence is not connected yet. Your entries remain available and nothing was saved.</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className="rounded-xl px-5 py-3 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" type="submit">{mode === "create" ? "Create Event" : "Save Changes"}</button>
      </div>
    </form>
  );
}

function SectionHeading({ id, number, optional, required, title }: { id: string; number: string; optional?: boolean; required?: boolean; title: string }) {
  return <div className="flex items-center gap-2"><span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-[#ffdad2] text-xs font-bold text-[#703628]">{number}</span><h2 className="text-base font-bold text-[#302526]" id={id}>{title}{required ? <span className="ml-1 text-[#852c3a]">*</span> : null}{optional ? <span className="ml-1 text-sm font-normal text-[#776566]">(Optional)</span> : null}</h2></div>;
}

function Field({ children, count, error, htmlFor, label, optional, required }: { children: ReactNode; count?: string; error?: string; htmlFor: string; label: string; optional?: boolean; required?: boolean }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-sm font-semibold text-[#302526]" htmlFor={htmlFor}>{label}{required ? <span className="ml-1 text-[#852c3a]">*</span> : null}{optional ? <span className="ml-1 font-normal text-[#776566]">(Optional)</span> : null}</label>{count ? <span className="text-xs text-[#887273]">{count}</span> : null}</div>{children}<FieldError id={`${htmlFor}-error`} message={error} /></div>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-semibold text-[#a22531]" id={id} role="alert">{message}</p> : null;
}
