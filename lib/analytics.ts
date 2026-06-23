"use client";

import { pushEvent } from "@/components/analytics/GTM";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, properties?: EventProperties) {
  pushEvent(event, properties);

  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog;
    if (ph?.capture) {
      ph.capture(event, properties);
    }
  }
}

export const EVENTS = {
  PAGE_VIEW: "apply_page_view",
  FORM_STARTED: "apply_form_started",
  SECTION_1_DONE: "apply_section_1_done",
  SECTION_2_DONE: "apply_section_2_done",
  SECTION_3_DONE: "apply_section_3_done",
  SECTION_4_DONE: "apply_section_4_done",
  SECTION_5_DONE: "apply_section_5_done",
  PRIVACY_CHECKED: "apply_privacy_checked",
  SUBMIT_ATTEMPTED: "apply_submit_attempted",
  VALIDATION_ERROR: "apply_validation_error",
  SUBMITTED: "apply_submitted",
  SUCCESS_VIEWED: "apply_success_viewed",
  BACK_TO_SITE: "apply_back_to_site",
} as const;
