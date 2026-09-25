"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getSriLankaTodayDate } from "@make-my-marriage/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { WeddingDashboardEmpty } from "@/components/weddings/dashboard/wedding-dashboard-empty";
import { ApiError, createWedding } from "@/lib/api";
import { setCurrentWeddingId } from "@/lib/wedding-selection";
import {
  weddingOnboardingSchema,
  type WeddingCreatorSide,
  type WeddingManagementType,
  type WeddingOnboardingValues,
} from "@/lib/validation/wedding-onboarding-schema";
import { useAppSelector } from "@/store/hooks";
import { OnboardingStepper } from "./onboarding-stepper";
import { OnboardingSubmissionState } from "./submission-state";

const managementOptions: Array<{ value: WeddingManagementType; title: string; description: string; symbol: string }> = [
  { value: "BRIDE_SIDE", title: "Bride Side", description: "The bride's family starts and manages this wedding workspace.", symbol: "B" },
  { value: "GROOM_SIDE", title: "Groom Side", description: "The groom's family starts and manages this wedding workspace.", symbol: "G" },
  { value: "JOINT", title: "Joint Wedding", description: "Both families plan together in one shared wedding workspace.", symbol: "J" },
];

const fieldClass = "mt-2 w-full rounded-xl border border-[#cdbfc0] bg-white px-4 py-3 text-sm text-[#302526] shadow-sm outline-none transition placeholder:text-[#a08f90] focus:border-[#852c3a] focus:ring-3 focus:ring-[#852c3a]/12 aria-invalid:border-[#ba1a1a] aria-invalid:ring-[#ba1a1a]/10";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs font-semibold text-[#a22531]" role="alert">{message}</p> : null;
}

function formatManagementType(type: WeddingManagementType) {
  return type === "JOINT" ? "Joint Wedding" : type === "BRIDE_SIDE" ? "Bride Side" : "Groom Side";
}

function formatCreatorSide(side: WeddingCreatorSide) {
  return side === "BOTH" ? "Both sides" : side === "BRIDE" ? "Bride side" : "Groom side";
}

export function WeddingOnboarding() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState(1);
  const [showDashboardPreview, setShowDashboardPreview] = useState(false);
  const [submissionState, setSubmissionState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [submissionMessage, setSubmissionMessage] = useState<string>();
  const usesSuggestedWorkspaceName = useRef(true);
  const {
    register,
    setValue,
    setError,
    resetField,
    trigger,
    getValues,
    control,
    formState: { errors },
  } = useForm<WeddingOnboardingValues>({
    resolver: zodResolver(weddingOnboardingSchema),
    defaultValues: { brideName: "", groomName: "", workspaceName: "", mainWeddingDate: "" },
    mode: "onTouched",
  });

  const [managementType, creatorSide, brideName, groomName, workspaceName, mainWeddingDate] = useWatch({
    control,
    name: ["managementType", "creatorSide", "brideName", "groomName", "workspaceName", "mainWeddingDate"],
  });
  const workspaceNameField = register("workspaceName");

  useEffect(() => {
    if (!usesSuggestedWorkspaceName.current) return;
    const names = [groomName?.trim(), brideName?.trim()].filter(Boolean);
    setValue("workspaceName", names.length ? `${names.join(" & ")} Wedding` : "");
  }, [brideName, groomName, setValue]);

  function selectManagementType(type: WeddingManagementType) {
    const previousType = managementType;
    setValue("managementType", type, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    if (type === "BRIDE_SIDE") setValue("creatorSide", "BRIDE", { shouldDirty: true, shouldValidate: true });
    if (type === "GROOM_SIDE") setValue("creatorSide", "GROOM", { shouldDirty: true, shouldValidate: true });
    if (type === "JOINT" && previousType !== "JOINT") resetField("creatorSide");
  }

  async function continueFromSetup() {
    const valid = await trigger(["managementType", "creatorSide"], { shouldFocus: true });
    if (valid) { setSubmissionState("idle"); setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  async function continueFromDetails() {
    const valid = await trigger(["brideName", "groomName", "workspaceName", "mainWeddingDate"], { shouldFocus: true });
    if (valid) { setSubmissionState("idle"); setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  async function showPreview() {
    if (await trigger(undefined, { shouldFocus: true })) { setShowDashboardPreview(true); window.scrollTo({ top: 0 }); }
  }

  async function handleCreateWedding() {
    if (!await trigger(undefined, { shouldFocus: true })) return;
    setSubmissionState("loading");
    setSubmissionMessage(undefined);

    const values = getValues();
    try {
      const wedding = await createWedding({
        name: values.workspaceName.trim(),
        brideName: values.brideName.trim(),
        groomName: values.groomName.trim(),
        managementType: values.managementType,
        creatorSide: values.creatorSide,
        mainWeddingDate: values.mainWeddingDate || null,
      });
      setCurrentWeddingId(wedding.id);
      setSubmissionState("success");
      router.replace(`/weddings/${wedding.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldMap: Record<string, keyof WeddingOnboardingValues> = {
          name: "workspaceName",
          brideName: "brideName",
          groomName: "groomName",
          managementType: "managementType",
          creatorSide: "creatorSide",
          mainWeddingDate: "mainWeddingDate",
        };
        for (const [field, messages] of Object.entries(error.fields ?? {})) {
          const formField = fieldMap[field];
          if (formField && messages[0]) setError(formField, { type: "server", message: messages[0] });
        }
        setSubmissionMessage(error.message);
      } else {
        setSubmissionMessage("The wedding could not be created. Please try again.");
      }
      setSubmissionState("error");
    }
  }

  if (!user) return null;

  if (showDashboardPreview) {
    const values = getValues();
    return <WeddingDashboardEmpty data={{ ...values, mainWeddingDate: values.mainWeddingDate || undefined, ownerName: [user.firstName, user.lastName].filter(Boolean).join(" "), memberRole: "OWNER" }} onBack={() => setShowDashboardPreview(false)} preview />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fcf9f8] text-[#1b1c1c]">
      <a className="skip-link" href="#onboarding-content">Skip to content</a>
      <header className="border-b border-[#e8dfd8] bg-[#fcf9f8]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex min-w-0 items-center gap-2 rounded-full bg-[#f6f3f2] px-3 py-2 text-xs font-semibold text-[#554243] sm:text-sm"><span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#852c3a] text-[0.65rem] text-white">{user.firstName.charAt(0).toUpperCase()}</span><span className="truncate">{user.firstName}</span></div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12" id="onboarding-content">
        <div className="mx-auto max-w-3xl">
          <OnboardingStepper currentStep={step} />

          <section className="mt-8 rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-[0_20px_55px_-38px_rgba(103,21,37,0.5)] sm:p-8">
            {step === 1 ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Step 1 of 3</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#302526] sm:text-3xl">How will you plan this wedding?</h1>
                <p className="mt-3 text-sm leading-6 text-[#665456] sm:text-base">Choose the planning setup that fits both families. You can change a single-side wedding to Joint later.</p>

                <fieldset className="mt-7">
                  <legend className="text-sm font-bold text-[#302526]">Wedding management type <span className="text-[#a22531]">*</span></legend>
                  <div className="mt-3 grid gap-3">
                    {managementOptions.map((option) => {
                      const selected = managementType === option.value;
                      return (
                        <label className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition focus-within:ring-3 focus-within:ring-[#852c3a]/20 sm:p-5 ${selected ? "border-[#852c3a] bg-[#fff7f6] shadow-sm" : "border-[#ded3d0] bg-white hover:border-[#c47a68]"}`} key={option.value}>
                          <input className="peer sr-only" type="radio" value={option.value} {...register("managementType")} onChange={() => selectManagementType(option.value)} />
                          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selected ? "bg-[#852c3a] text-white" : "bg-[#f4e8e5] text-[#852c3a]"}`}>{option.symbol}</span>
                          <span className="min-w-0 flex-1"><strong className="block text-sm text-[#302526] sm:text-base">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-[#665456] sm:text-sm">{option.description}</span></span>
                          <span aria-hidden="true" className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#852c3a] bg-[#852c3a] text-xs text-white" : "border-[#bcaeb0]"}`}>{selected ? "✓" : ""}</span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError message={errors.managementType?.message} />
                </fieldset>

                {managementType ? (
                  <fieldset className="mt-6 rounded-xl bg-[#f6f3f2] p-4 sm:p-5">
                    <legend className="px-1 text-sm font-bold text-[#302526]">Your side <span className="text-[#a22531]">*</span></legend>
                    {managementType === "JOINT" ? (
                      <>
                        <p className="mt-1 text-xs leading-5 text-[#665456] sm:text-sm">This records which side you represent in this wedding. Your role will be Owner regardless of this choice.</p>
                        <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Creator side">
                          {(["BRIDE", "GROOM", "BOTH"] as const).map((side) => <label className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-xs font-bold transition focus-within:ring-3 focus-within:ring-[#852c3a]/20 sm:text-sm ${creatorSide === side ? "border-[#852c3a] bg-[#852c3a] text-white" : "border-[#d8cbcc] bg-white text-[#554243] hover:border-[#c47a68]"}`} key={side}><input className="sr-only" type="radio" value={side} {...register("creatorSide")} />{side === "BOTH" ? "Both" : side[0] + side.slice(1).toLowerCase()}</label>)}
                        </div>
                      </>
                    ) : <p className="mt-2 text-sm text-[#554243]">Your side will be <strong className="text-[#671525]">{managementType === "BRIDE_SIDE" ? "Bride" : "Groom"}</strong>. You will become the first Owner of this workspace.</p>}
                    <FieldError message={errors.creatorSide?.message} />
                  </fieldset>
                ) : null}

                <div className="mt-8 flex justify-end"><button className="w-full rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] sm:w-auto" onClick={continueFromSetup} type="button">Continue</button></div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Step 2 of 3</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#302526] sm:text-3xl">Tell us about the wedding</h1>
                <p className="mt-3 text-sm leading-6 text-[#665456] sm:text-base">Add the essential details for your shared workspace. You can update them later.</p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-[#302526]">Bride name <span className="text-[#a22531]">*</span><input aria-invalid={Boolean(errors.brideName)} autoComplete="name" className={fieldClass} placeholder="Enter the bride's name" {...register("brideName")} /><FieldError message={errors.brideName?.message} /></label>
                  <label className="block text-sm font-bold text-[#302526]">Groom name <span className="text-[#a22531]">*</span><input aria-invalid={Boolean(errors.groomName)} autoComplete="name" className={fieldClass} placeholder="Enter the groom's name" {...register("groomName")} /><FieldError message={errors.groomName?.message} /></label>
                  <label className="block text-sm font-bold text-[#302526] sm:col-span-2">Wedding workspace name <span className="text-[#a22531]">*</span><input aria-invalid={Boolean(errors.workspaceName)} className={fieldClass} placeholder="Enter a name for your wedding workspace" {...workspaceNameField} onChange={(event) => { usesSuggestedWorkspaceName.current = false; void workspaceNameField.onChange(event); }} /><span className="mt-2 block text-xs font-normal leading-5 text-[#776566]">We suggest a name from the couple&apos;s names. You can edit it.</span><FieldError message={errors.workspaceName?.message} /></label>
                  <label className="block text-sm font-bold text-[#302526] sm:col-span-2">Main wedding date <span className="font-normal text-[#776566]">(optional)</span><input aria-invalid={Boolean(errors.mainWeddingDate)} className={fieldClass} min={getSriLankaTodayDate()} type="date" {...register("mainWeddingDate")} /><span className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-normal leading-5 text-[#776566]"><span>Select today or a future date. You can add or change it later.</span><button aria-pressed={!mainWeddingDate} className="rounded-md font-bold text-[#852c3a] underline decoration-[#c47a68]/60 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => setValue("mainWeddingDate", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true })} type="button">We haven&apos;t decided yet</button></span><FieldError message={errors.mainWeddingDate?.message} /></label>
                </div>
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button className="rounded-xl border border-[#cdbfc0] px-6 py-3 text-sm font-bold text-[#554243] transition hover:bg-[#f6f3f2] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" onClick={() => setStep(1)} type="button">Back</button><button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 transition hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" onClick={continueFromDetails} type="button">Continue</button></div>
              </>
            ) : null}

            {step === 3 && managementType && creatorSide ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Step 3 of 3</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#302526] sm:text-3xl">Review your wedding workspace</h1>
                <p className="mt-3 text-sm leading-6 text-[#665456] sm:text-base">Check these details before creating your workspace.</p>
                <div className="mt-7 space-y-4">
                  <section className="rounded-xl border border-[#e8dfd8] bg-[#fcf9f8] p-4 sm:p-5" aria-labelledby="setup-review-title"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold" id="setup-review-title">Wedding setup</h2><p className="mt-1 text-sm text-[#665456]">{formatManagementType(managementType)}</p></div><button className="rounded-lg px-3 py-2 text-xs font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => setStep(1)} type="button">Edit</button></div><dl className="mt-4 grid gap-3 border-t border-[#e8dfd8] pt-4 sm:grid-cols-2"><div><dt className="text-xs text-[#776566]">Your role</dt><dd className="mt-1 text-sm font-bold">Owner</dd></div><div><dt className="text-xs text-[#776566]">Your side</dt><dd className="mt-1 text-sm font-bold">{formatCreatorSide(creatorSide)}</dd></div></dl></section>
                  <section className="rounded-xl border border-[#e8dfd8] bg-[#fcf9f8] p-4 sm:p-5" aria-labelledby="details-review-title"><div className="flex items-start justify-between gap-4"><h2 className="font-bold" id="details-review-title">Wedding details</h2><button className="rounded-lg px-3 py-2 text-xs font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" onClick={() => setStep(2)} type="button">Edit</button></div><dl className="mt-4 grid gap-4 border-t border-[#e8dfd8] pt-4 sm:grid-cols-2"><div><dt className="text-xs text-[#776566]">Bride</dt><dd className="mt-1 text-sm font-bold">{brideName}</dd></div><div><dt className="text-xs text-[#776566]">Groom</dt><dd className="mt-1 text-sm font-bold">{groomName}</dd></div><div><dt className="text-xs text-[#776566]">Workspace name</dt><dd className="mt-1 text-sm font-bold">{workspaceName}</dd></div><div><dt className="text-xs text-[#776566]">Main wedding date</dt><dd className="mt-1 text-sm font-bold">{mainWeddingDate ? new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mainWeddingDate}T00:00:00Z`)) : "Not decided yet"}</dd></div></dl></section>
                  <div className="rounded-xl bg-[#f4e8e5] p-4 text-sm leading-6 text-[#554243]"><strong className="text-[#671525]">Ownership and next steps.</strong> Creating this workspace will make you its first Owner. Member invitations will be available later from Members & Permissions.</div>
                </div>
                <OnboardingSubmissionState message={submissionMessage} state={submissionState} />
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-between"><button className="rounded-xl border border-[#cdbfc0] px-6 py-3 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-60" disabled={submissionState === "loading"} onClick={() => { setSubmissionState("idle"); setSubmissionMessage(undefined); setStep(2); }} type="button">Back</button><div className="flex flex-col gap-3 sm:flex-row"><button className="rounded-xl border border-[#852c3a] px-5 py-3 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-60" disabled={submissionState === "loading"} onClick={showPreview} type="button">Preview empty dashboard</button><button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a] disabled:cursor-not-allowed disabled:opacity-60" disabled={submissionState === "loading"} onClick={handleCreateWedding} type="button">{submissionState === "loading" ? "Creating Wedding…" : "Create Wedding"}</button></div></div>
              </>
            ) : null}
          </section>
        </div>
      </main>
      <footer className="border-t border-[#e8dfd8] px-4 py-5 text-center text-xs text-[#776566]">© 2026 Make My Marriage · A calm wedding workspace for couples and families.</footer>
    </div>
  );
}
