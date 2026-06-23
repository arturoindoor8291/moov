"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { applicationSchema, ApplicationData } from "@/lib/schema";
import { trackEvent, EVENTS } from "@/lib/analytics";
import { AboutYouSection } from "./AboutYouSection";
import { AboutCompanySection } from "./AboutCompanySection";
import { TractionSection } from "./TractionSection";
import { InvestmentRoundSection } from "./InvestmentRoundSection";
import { PitchSection } from "./PitchSection";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<ApplicationData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      discountRate: null,
      interestRate: null,
      website: "",
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    },
  });

  useEffect(() => {
    trackEvent(EVENTS.PAGE_VIEW);
  }, []);

  function handleFirstInteraction() {
    if (!hasStarted.current) {
      hasStarted.current = true;
      trackEvent(EVENTS.FORM_STARTED);
    }
  }

  async function onSubmit(data: ApplicationData) {
    setLoading(true);
    setServerError(null);
    trackEvent(EVENTS.SUBMIT_ATTEMPTED, {
      instrument_type: data.instrument,
      round_stage: data.roundStage,
      vertical: data.vertical,
      country: data.country,
    });

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        trackEvent(EVENTS.SUBMITTED, {
          instrument_type: data.instrument,
          round_stage: data.roundStage,
          vertical: data.vertical,
          country: data.country,
          source: data.utmSource,
        });
        router.push("/apply/success");
      } else {
        const body = await res.json().catch(() => ({}));
        const message =
          res.status === 429
            ? "Too many applications from your network. Please try again in an hour."
            : body.message || "Something went wrong. Please try again or email us at deals@moov.vc";
        setServerError(message);
        trackEvent(EVENTS.VALIDATION_ERROR, { error: message, status: res.status });
      }
    } catch {
      const message = "Network error. Please check your connection and try again.";
      setServerError(message);
      trackEvent(EVENTS.VALIDATION_ERROR, { error: message });
    } finally {
      setLoading(false);
    }
  }

  function onInvalid() {
    trackEvent(EVENTS.VALIDATION_ERROR, { error: "client_validation" });
    const firstError = Object.keys(errors)[0] as keyof ApplicationData;
    if (firstError) {
      try {
        setFocus(firstError);
      } catch {
        const el = document.querySelector(`[name="${firstError}"]`) as HTMLElement;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  return (
    <form
      id="main-form"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-9"
      noValidate
      onFocus={handleFirstInteraction}
    >
      <div
        className="font-mono text-[11px] tracking-[0.1em] uppercase"
        style={{ color: "rgba(238,241,246,0.4)" }}
      >
        APPLICATION FORM · ~5 min
      </div>

      <AboutYouSection register={register} errors={errors} />
      <AboutCompanySection register={register} errors={errors} />
      <TractionSection register={register} errors={errors} />
      <InvestmentRoundSection register={register} errors={errors} watch={watch} />
      <PitchSection register={register} errors={errors} />

      {/* Privacy consent */}
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-none">
            <input
              type="checkbox"
              {...register("privacyConsent")}
              onChange={(e) => {
                register("privacyConsent").onChange(e);
                if (e.target.checked) trackEvent(EVENTS.PRIVACY_CHECKED);
              }}
              aria-required="true"
              aria-describedby={errors.privacyConsent ? "privacy-error" : undefined}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#2f6dff",
                cursor: "pointer",
                minWidth: "18px",
              }}
            />
          </div>
          <span className="text-sm leading-relaxed" style={{ color: "rgba(238,241,246,0.65)" }}>
            I agree to the{" "}
            <a
              href="https://moov.vc/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#34d3ff", textDecoration: "underline" }}
            >
              Privacy Policy
            </a>{" "}
            and consent to MOOV processing my personal data in accordance with{" "}
            <strong style={{ color: "#eef1f6" }}>LFPDPPP</strong> (Mexico) and{" "}
            <strong style={{ color: "#eef1f6" }}>GDPR</strong> regulations.
            <span style={{ color: "#ef4444" }}> *</span>
          </span>
        </label>
        {errors.privacyConsent && (
          <p id="privacy-error" role="alert" className="text-xs font-mono" style={{ color: "#ef4444" }}>
            {errors.privacyConsent.message}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-4 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5",
          }}
        >
          {serverError}
        </div>
      )}

      <SubmitButton loading={loading} />

      <p className="text-center text-xs" style={{ color: "rgba(238,241,246,0.3)" }}>
        We read every application and respond within 14 days.
      </p>
    </form>
  );
}
