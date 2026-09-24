"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import type { WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { ApiError } from "@/lib/api";
import { eventFormSchema, eventSideForWedding, enforceWeddingEventSide, type EventFormValues } from "@/lib/validation/event-schema";

const sideOptions: Array<{ value: WeddingSide; label: string; description: string }> = [
  { value: "BRIDE", label: "Bride Side", description: "Bride's household event" },
  { value: "GROOM", label: "Groom Side", description: "Groom's household event" },
  { value: "BOTH", label: "Both Sides", description: "Joint celebration" },
];

const inputClass = "w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 py-2.5 text-sm text-[#302526] transition placeholder:text-[#998889] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20";
const eventFieldNames = ["name", "description", "side", "eventDate", "startTime", "endTime", "venueName", "address"] as const;

export function EventForm({ initialValues, managementType, mode, onCancel, onSubmit }: { initialValues?: Partial<EventFormValues>; managementType: WeddingManagementType; mode: "create" | "edit"; onCancel: () => void; onSubmit: (values: EventFormValues) => Promise<void> }) {
  const fixedSide = eventSideForWedding(managementType);
  const [submissionError, setSubmissionError] = useState<string>();
  const { control, formState: { errors, isSubmitting }, handleSubmit, register, setError, setValue } = useForm<EventFormValues>({
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
      tasks: initialValues?.tasks ?? [],
    },
  });
  const { append: appendTask, fields: taskFields, remove: removeTask } = useFieldArray({ control, name: "tasks" });
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const selectedSide = useWatch({ control, name: "side" });
  const draftTasks = useWatch({ control, name: "tasks" });

  useEffect(() => {
    if (selectedSide !== "BRIDE" && selectedSide !== "GROOM") return;
    draftTasks.forEach((task, index) => {
      if (task.side !== selectedSide) setValue(`tasks.${index}.side`, selectedSide, { shouldDirty: true, shouldValidate: true });
    });
  }, [draftTasks, selectedSide, setValue]);

  function addDraftTask() {
    appendTask({
      name: "",
      description: "",
      side: selectedSide === "BRIDE" || selectedSide === "GROOM" ? selectedSide : "" as WeddingSide,
      dueDate: "",
    });
  }

  function clearSchedule() {
    setSubmissionError(undefined);
    setValue("eventDate", "", { shouldDirty: true, shouldValidate: true });
    setValue("startTime", "", { shouldDirty: true, shouldValidate: true });
    setValue("endTime", "", { shouldDirty: true, shouldValidate: true });
  }

  const submit = handleSubmit(async (values) => {
    const normalizedValues = enforceWeddingEventSide(values, managementType);
    if (normalizedValues.side !== values.side) setValue("side", normalizedValues.side, { shouldValidate: true });
    setSubmissionError(undefined);
    try {
      await onSubmit(normalizedValues);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (eventFieldNames.includes(field as typeof eventFieldNames[number]) && messages[0]) {
            setError(field as typeof eventFieldNames[number], { message: messages[0], type: "server" });
          }
        }
      }
      setSubmissionError(error instanceof ApiError ? error.message : "The Event could not be saved. Please try again.");
    }
  });

  return (
    <form className="rounded-2xl border border-[#eee6e2] bg-white p-4 shadow-sm sm:p-6 lg:p-8" noValidate onChange={() => setSubmissionError(undefined)} onSubmit={submit}>
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
              <p className="mt-1 text-xs leading-5 text-[#665456]">This wedding type fixes every Event to the {fixedSide === "BRIDE" ? "bride" : "groom"} side.</p>
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

        {mode === "create" ? <>
          <div className="h-px bg-[#eee6e2]" />
          <section aria-labelledby="event-tasks-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><SectionHeading number="5" title="Preparation Tasks" optional id="event-tasks-heading" /><p className="mt-2 text-xs leading-5 text-[#776566]">These Tasks will be saved atomically with the Event. You can also add Tasks later from Event Details.</p></div>
              <button className="shrink-0 rounded-lg border border-[#d9c9ca] bg-white px-4 py-2.5 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={addDraftTask} type="button">+ Add Task</button>
            </div>
            {taskFields.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-[#d9c9ca] bg-[#fcf9f8] px-4 py-8 text-center text-sm text-[#665456]">No preparation Tasks added. This is optional.</div> : null}
            <div className="mt-4 space-y-4">
              {taskFields.map((field, index) => {
                const taskSide = draftTasks[index]?.side;
                const fixedTaskSide = selectedSide === "BRIDE" || selectedSide === "GROOM" ? selectedSide : undefined;
                return (
                  <fieldset className="rounded-xl border border-[#e3d9d5] bg-[#fcf9f8] p-4 sm:p-5" key={field.id}>
                    <legend className="sr-only">Preparation Task {index + 1}</legend>
                    <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#302526]">Task {index + 1}</h3><button aria-label={`Remove preparation Task ${index + 1}`} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#a22531] hover:bg-[#fff2f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a22531]" onClick={() => removeTask(index)} type="button">Remove</button></div>
                    <div className="grid gap-4">
                      <Field error={errors.tasks?.[index]?.name?.message} htmlFor={`draft-task-${index}-name`} label="Task name" required><input aria-describedby={errors.tasks?.[index]?.name ? `draft-task-${index}-name-error` : undefined} aria-invalid={Boolean(errors.tasks?.[index]?.name)} className={inputClass} id={`draft-task-${index}-name`} maxLength={140} placeholder="Enter a preparation task" {...register(`tasks.${index}.name`)} /></Field>
                      <Field error={errors.tasks?.[index]?.description?.message} htmlFor={`draft-task-${index}-description`} label="Description" optional><textarea aria-describedby={errors.tasks?.[index]?.description ? `draft-task-${index}-description-error` : undefined} aria-invalid={Boolean(errors.tasks?.[index]?.description)} className={`${inputClass} min-h-20 resize-y`} id={`draft-task-${index}-description`} maxLength={1000} placeholder="Add helpful details" rows={3} {...register(`tasks.${index}.description`)} /></Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><p className="mb-1.5 text-sm font-semibold text-[#302526]">Task Side <span className="text-[#852c3a]">*</span></p>{fixedTaskSide ? <div className="rounded-lg border border-[#d9c9ca] bg-[#f8f2f0] px-3.5 py-2.5"><input type="hidden" value={fixedTaskSide} {...register(`tasks.${index}.side`)} /><p className="text-sm font-bold text-[#671525]">{fixedTaskSide === "BRIDE" ? "Bride Side" : "Groom Side"}</p></div> : selectedSide === "BOTH" ? <div className="flex flex-wrap gap-2">{sideOptions.map((option) => <label className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#852c3a] ${taskSide === option.value ? "border-[#852c3a] bg-[#fff7f6] text-[#671525]" : "border-[#d9c9ca] bg-white text-[#665456]"}`} key={option.value}><input className="sr-only" type="radio" value={option.value} {...register(`tasks.${index}.side`)} />{option.label}</label>)}</div> : <p className="rounded-lg bg-[#f0eded] px-3 py-2.5 text-xs text-[#665456]">Choose an Event Side first.</p>}<FieldError id={`draft-task-${index}-side-error`} message={errors.tasks?.[index]?.side?.message} /></div>
                        <Field error={errors.tasks?.[index]?.dueDate?.message} htmlFor={`draft-task-${index}-due-date`} label="Due date" optional><input aria-describedby={errors.tasks?.[index]?.dueDate ? `draft-task-${index}-due-date-error` : undefined} aria-invalid={Boolean(errors.tasks?.[index]?.dueDate)} className={inputClass} id={`draft-task-${index}-due-date`} type="date" {...register(`tasks.${index}.dueDate`)} /></Field>
                      </div>
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <FieldError id="event-tasks-error" message={errors.tasks?.root?.message ?? errors.tasks?.message} />
          </section>
        </> : null}
      </div>

      {submissionError ? <p className="mt-8 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-3 text-sm text-[#8b1f2d]" role="alert">{submissionError}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className="rounded-xl px-5 py-3 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? (mode === "create" ? "Creating Event…" : "Saving Changes…") : (mode === "create" ? "Create Event" : "Save Changes")}</button>
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
