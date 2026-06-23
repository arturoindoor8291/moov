import { z } from "zod";

const currentYear = new Date().getFullYear();

export const verticals = [
  "Ride-hailing / Ridesharing",
  "Micromobility (scooters, bikes)",
  "Fleet management",
  "Logistics & last-mile",
  "EV / Clean energy mobility",
  "Public transit tech",
  "Parking & infrastructure",
  "Auto fintech",
  "Other",
] as const;

export const salesModels = [
  "B2C",
  "B2B",
  "B2B2C",
  "B2B2B",
  "B2G",
  "B2B Marketplace",
  "B2C Marketplace",
  "C2C Marketplace",
  "Other",
] as const;

export const productStages = [
  "1 — In the planning phase",
  "2 — In programming or product development",
  "3 — Product ready to receive feedback from potential customers",
  "4 — Product with letters of intent or pre-sales",
  "5 — Product with sales",
] as const;

export const roundStages = ["Pre-seed", "Seed", "Series A", "Series B+"] as const;

export const instruments = [
  "Convertible Note",
  "SAFE",
  "Equity",
  "Warrants",
  "Debt",
  "Not defined",
] as const;

export const referralSources = [
  "LinkedIn",
  "Referral (founder)",
  "Referral (investor)",
  "Event / conference",
  "Social media",
  "Press / media",
  "Other",
] as const;

export const CONVERTIBLE_INSTRUMENTS = ["Convertible Note", "SAFE"] as const;

export const applicationSchema = z
  .object({
    // Section 01 — About You
    founderName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Please enter a valid email address"),
    linkedinUrl: z
      .string()
      .url("Please enter a valid LinkedIn URL")
      .refine(
        (url) => url.includes("linkedin.com"),
        "Must be a LinkedIn URL (linkedin.com/in/...)"
      ),

    // Section 02 — About Your Company
    startupName: z.string().min(1, "Please enter your startup name"),
    website: z.union([z.string().url("Please enter a valid URL"), z.literal("")]).optional(),
    country: z.string().min(1, "Please select or enter your country"),
    yearOfFoundation: z
      .number({ error: "Please enter a valid year" })
      .int()
      .min(2000, "Year must be 2000 or later")
      .max(currentYear, `Year cannot be in the future`),
    vertical: z.enum(verticals, { error: "Please select a vertical" }),
    salesModel: z.enum(salesModels, { error: "Please select a sales model" }),
    companyDescription: z
      .string()
      .min(50, "Please describe your company in at least 50 characters")
      .max(1000, "Description must be under 1000 characters"),
    productStage: z.enum(productStages, { error: "Please select a product stage" }),
    numberOfCoFounders: z
      .number({ error: "Please enter a number" })
      .int()
      .min(1, "Must have at least 1 co-founder")
      .max(10, "Maximum 10 co-founders"),
    teamSize: z
      .number({ error: "Please enter a number" })
      .int()
      .min(1, "Team size must be at least 1"),

    // Section 03 — Traction
    netRevenueLTM: z
      .number({ error: "Please enter a number" })
      .min(0, "Revenue cannot be negative"),
    lastMonthNetRevenue: z
      .number({ error: "Please enter a number" })
      .min(0, "Revenue cannot be negative"),
    totalCapitalRaised: z
      .number({ error: "Please enter a number" })
      .min(0, "Capital raised cannot be negative"),

    // Section 04 — Investment Round
    roundStage: z.enum(roundStages, { error: "Please select a round stage" }),
    instrument: z.enum(instruments, { error: "Please select an instrument" }),
    roundSize: z
      .number({ error: "Please enter a number" })
      .positive("Round size must be greater than 0"),
    preMoneyValuationCap: z
      .number({ error: "Please enter a number" })
      .positive("Valuation / CAP must be greater than 0"),
    discountRate: z
      .number({ error: "Please enter a number" })
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    interestRate: z
      .number({ error: "Please enter a number" })
      .min(0)
      .max(100)
      .optional()
      .nullable(),

    // Section 05 — Pitch
    pitchDeckLink: z.string().url("Please enter a valid URL for your pitch deck"),
    howDidYouFindUs: z.enum(referralSources, { error: "Please select how you found us" }),

    // Consent
    privacyConsent: z.literal(true, {
      error: "You must accept the privacy policy to submit",
    }),

    // UTM tracking (optional, captured from URL params)
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isConvertible = (CONVERTIBLE_INSTRUMENTS as readonly string[]).includes(data.instrument);
    if (isConvertible) {
      if (data.discountRate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discount Rate is required for convertible instruments",
          path: ["discountRate"],
        });
      }
      if (data.interestRate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Interest Rate is required for convertible instruments",
          path: ["interestRate"],
        });
      }
    }
  });

export type ApplicationData = z.infer<typeof applicationSchema>;
