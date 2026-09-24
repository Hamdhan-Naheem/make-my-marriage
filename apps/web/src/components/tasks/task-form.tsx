"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { WeddingEvent, WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { ApiError } from "@/lib/api";
import { createTaskFormSchema, taskSidesFor, type TaskFormValues } from "@/lib/validation/task-schema";

const sideOptions: Array<{ value: WeddingSide; label: string; description: string }> = [
  { value: "BRIDE", label: "Bride Side", description: "Bride-side preparation" },
  { value: "GROOM", label: "Groom Side", description: "Groom-side preparation" },
  { value: "BOTH", label: "Both Sides", description: "Shared preparation" },
];

const inputClass = "w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 py-2.5 text-sm text-[#302526] transition placeholder:text-[#998889] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20";
const taskFieldNames = ["name", "description", "side", "dueDate", "eventId"] as const;

export function TaskForm({ events, initialValues, managementType, mode, onCancel, onSubmit }: {
  events: WeddingEvent[];
  initialValues?: Partial<TaskFormValues>;
  managementType: WeddingManagementType;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}) {
  const schema = useMemo(() => createTaskFormSchema(managementType, events), [events, managementType]);
  const [submissionError, setSubmissionError] = useState<string>();
  const { control, formState: { errors, isSubmitting }, handleSubmit, register, setError, setValue } = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      side: initialValues?.side,
      dueDate: initialValues?.dueDate ?? "",
      eventId: initialValues?.eventId ?? "",
    },
  });
  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const selectedEventId = useWatch({ control, name: "eventId" });
  const selectedSide = useWatch({ control, name: "side" });
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const allowedSides = taskSidesFor(managementType, selectedEvent?.side);
  const fixedSide = allowedSides.length === 1 ? allowedSides[0] : undefined;

  useEffect(() => {
    if (fixedSide && selectedSide !== fixedSide) setValue("side", fixedSide, { shouldDirty: true, shouldValidate: true });
  }, [fixedSide, selectedSide, setValue]);

  const submit = handleSubmit(async (values) => {
    setSubmissionError(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (taskFieldNames.includes(field as typeof taskFieldNames[number]) && messages[0]) {
            setError(field as typeof taskFieldNames[number], { message: messages[0], type: "server" });
          }
        }
      }
      setSubmissionError(error instanceof ApiError ? error.message : "The Task could not be saved. Please try again.");
    }
  });

  return (
    <form className="rounded-2xl border border-[#eee6e2] bg-white p-4 shadow-sm sm:p-6 lg:p-8" noValidate onChange={() => setSubmissionError(undefined)} onSubmit={submit}>
      <div className="space-y-8">
        <section aria-labelledby="task-details-heading">
          <SectionHeading id="task-details-heading" number="1" title="Task Details" />
          <div className="mt-4 grid gap-5">
            <Field count={`${name?.length ?? 0} / 140`} error={errors.name?.message} htmlFor="task-name" label="Task name" required>
              <input aria-describedby={errors.name ? "task-name-error" : undefined} aria-invalid={Boolean(errors.name)} className={inputClass} id="task-name" maxLength={140} placeholder="Enter a task name" {...register("name")} />
            </Field>
            <Field count={`${description?.length ?? 0} / 1,000`} error={errors.description?.message} htmlFor="task-description" label="Description" optional>
              <textarea aria-describedby={errors.description ? "task-description-error" : undefined} aria-invalid={Boolean(errors.description)} className={`${inputClass} min-h-24 resize-y`} id="task-description" maxLength={1000} placeholder="Add helpful details" rows={4} {...register("description")} />
            </Field>
          </div>
        </section>

        <div className="h-px bg-[#eee6e2]" />

        <section aria-labelledby="task-context-heading">
          <SectionHeading id="task-context-heading" number="2" title="Wedding Context" />
          <div className="mt-4 grid gap-5">
            <Field error={errors.eventId?.message} htmlFor="task-event" label="Linked Event" optional>
              <select aria-describedby={errors.eventId ? "task-event-error" : "task-event-help"} aria-invalid={Boolean(errors.eventId)} className={inputClass} id="task-event" {...register("eventId")}>
                <option value="">Wedding-wide task</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.name} · {sideLabel(event.side)}</option>)}
              </select>
              {!errors.eventId ? <p className="mt-1.5 text-xs text-[#776566]" id="task-event-help">Leave this as wedding-wide when the Task is not tied to one Event.</p> : null}
            </Field>

            <fieldset>
              <legend className="text-sm font-semibold text-[#302526]">Task Side <span className="text-[#852c3a]">*</span></legend>
              {fixedSide ? (
                <div className="mt-2 rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] p-4">
                  <input type="hidden" value={fixedSide} {...register("side")} />
                  <p className="text-sm font-bold text-[#671525]">{sideLabel(fixedSide)}</p>
                  <p className="mt-1 text-xs leading-5 text-[#665456]">{selectedEvent ? `This Task must match the selected ${sideLabel(selectedEvent.side)} Event.` : "This wedding type fixes the Task Side."}</p>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {sideOptions.filter((option) => allowedSides.includes(option.value)).map((option) => (
                    <label className={`relative cursor-pointer rounded-xl border p-4 transition focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#852c3a] ${selectedSide === option.value ? "border-[#852c3a] bg-[#fff7f6] shadow-sm" : "border-[#ded3d1] bg-white hover:border-[#c47a68]"}`} key={option.value}>
                      <input aria-describedby={errors.side ? "task-side-error" : undefined} className="peer sr-only" type="radio" value={option.value} {...register("side")} />
                      <span aria-hidden="true" className={`mb-3 flex size-8 items-center justify-center rounded-full border-2 ${selectedSide === option.value ? "border-[#852c3a] bg-[#852c3a] text-white" : "border-[#c9bcbc] text-transparent"}`}>✓</span>
                      <strong className="block text-sm text-[#302526]">{option.label}</strong>
                      <span className="mt-1 block text-xs text-[#776566]">{option.description}</span>
                    </label>
                  ))}
                </div>
              )}
              <FieldError id="task-side-error" message={errors.side?.message} />
            </fieldset>
          </div>
        </section>

        <div className="h-px bg-[#eee6e2]" />

        <section aria-labelledby="task-schedule-heading">
          <SectionHeading id="task-schedule-heading" number="3" title="Due Date" optional />
          <div className="mt-4 max-w-md">
            <Field error={errors.dueDate?.message} htmlFor="task-due-date" label="Due date" optional>
              <input aria-describedby={errors.dueDate ? "task-due-date-error" : "task-due-date-help"} aria-invalid={Boolean(errors.dueDate)} className={inputClass} id="task-due-date" type="date" {...register("dueDate")} />
              {!errors.dueDate ? <p className="mt-1.5 text-xs text-[#776566]" id="task-due-date-help">The Task can remain without a due date.</p> : null}
            </Field>
          </div>
        </section>
      </div>

      {submissionError ? <p className="mt-8 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-3 text-sm text-[#8b1f2d]" role="alert">{submissionError}</p> : null}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className="rounded-xl px-5 py-3 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a] disabled:opacity-60" disabled={isSubmitting} onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? (mode === "create" ? "Creating Task…" : "Saving Changes…") : (mode === "create" ? "Create Task" : "Save Changes")}</button>
      </div>
    </form>
  );
}

function sideLabel(side: WeddingSide) {
  return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side";
}

function SectionHeading({ id, number, optional, title }: { id: string; number: string; optional?: boolean; title: string }) {
  return <div className="flex items-center gap-2"><span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-[#ffdad2] text-xs font-bold text-[#703628]">{number}</span><h2 className="text-base font-bold text-[#302526]" id={id}>{title}{optional ? <span className="ml-1 text-sm font-normal text-[#776566]">(Optional)</span> : null}</h2></div>;
}

function Field({ children, count, error, htmlFor, label, optional, required }: { children: ReactNode; count?: string; error?: string; htmlFor: string; label: string; optional?: boolean; required?: boolean }) {
  return <div><div className="mb-1.5 flex items-center justify-between gap-3"><label className="text-sm font-semibold text-[#302526]" htmlFor={htmlFor}>{label}{required ? <span className="ml-1 text-[#852c3a]">*</span> : null}{optional ? <span className="ml-1 font-normal text-[#776566]">(Optional)</span> : null}</label>{count ? <span className="text-xs text-[#887273]">{count}</span> : null}</div>{children}<FieldError id={`${htmlFor}-error`} message={error} /></div>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-semibold text-[#a22531]" id={id} role="alert">{message}</p> : null;
}
