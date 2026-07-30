import Airtable from "airtable";
import type { ApplicationData } from "./schema";

function getBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials are not configured.");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

const TABLE = process.env.AIRTABLE_TABLE_NAME || "Applications";

export interface ApplicationRecord {
  id: string;
  founderName: string;
  email: string;
  startupName: string;
  country: string;
  vertical: string;
  roundStage: string;
  instrument: string;
  roundSize: number;
  status: string;
  submittedAt: string;
  linkedinUrl: string;
  website: string;
  companyDescription: string;
  salesModel: string;
  productStage: string;
  numberOfCoFounders: number;
  teamSize: number;
  netRevenueLTM: number;
  lastMonthNetRevenue: number;
  totalCapitalRaised: number;
  preMoneyValuationCap: number;
  discountRate?: number;
  interestRate?: number;
  pitchDeckLink: string;
  howDidYouFindUs: string;
  notes: string;
}

export async function listApplications(): Promise<ApplicationRecord[]> {
  const base = getBase();
  const records = await base(TABLE)
    .select({ sort: [{ field: "Submitted At", direction: "desc" }] })
    .all();

  return records.map((r) => ({
    id: r.id,
    founderName: (r.fields["Founder Name"] as string) || "",
    email: (r.fields["Email"] as string) || "",
    startupName: (r.fields["Startup Name"] as string) || "",
    country: (r.fields["Country"] as string) || "",
    vertical: (r.fields["Vertical"] as string) || "",
    roundStage: (r.fields["Round Stage"] as string) || "",
    instrument: (r.fields["Instrument"] as string) || "",
    roundSize: (r.fields["Round Size (USD)"] as number) || 0,
    status: (r.fields["Status"] as string) || "New",
    submittedAt: (r.fields["Submitted At"] as string) || "",
    linkedinUrl: (r.fields["LinkedIn URL"] as string) || "",
    website: (r.fields["Website"] as string) || "",
    companyDescription: (r.fields["Company Description"] as string) || "",
    salesModel: (r.fields["Sales Model"] as string) || "",
    productStage: (r.fields["Product Stage"] as string) || "",
    numberOfCoFounders: (r.fields["Number of Co-founders"] as number) || 0,
    teamSize: (r.fields["Team Size"] as number) || 0,
    netRevenueLTM: (r.fields["Net Revenue LTM (USD)"] as number) || 0,
    lastMonthNetRevenue: (r.fields["Last Month Net Revenue (USD)"] as number) || 0,
    totalCapitalRaised: (r.fields["Total Capital Raised (USD)"] as number) || 0,
    preMoneyValuationCap: (r.fields["Pre-money Valuation / CAP (USD)"] as number) || 0,
    discountRate: r.fields["Discount Rate (%)"] as number | undefined,
    interestRate: r.fields["Interest Rate (%)"] as number | undefined,
    pitchDeckLink: (r.fields["Pitch Deck Link"] as string) || "",
    howDidYouFindUs: (r.fields["How did you find us?"] as string) || "",
    notes: (r.fields["Notes"] as string) || "",
  }));
}

export async function updateApplication(
  id: string,
  fields: { status?: string; notes?: string }
): Promise<void> {
  const base = getBase();
  const update: Airtable.FieldSet = {};
  if (fields.status !== undefined) update["Status"] = fields.status;
  if (fields.notes !== undefined) update["Notes"] = fields.notes;
  await base(TABLE).update(id, update, { typecast: true });
}

export async function createApplicationRecord(data: ApplicationData): Promise<string> {
  const base = getBase();
  const record = await base(TABLE).create(
    {
      "Founder Name": data.founderName,
      Email: data.email,
      "LinkedIn URL": data.linkedinUrl,
      "Startup Name": data.startupName,
      Website: data.website || "",
      Country: data.country,
      "Year of Foundation": data.yearOfFoundation,
      Vertical: data.vertical,
      "Sales Model": data.salesModel,
      "Company Description": data.companyDescription,
      "Product Stage": data.productStage,
      "Number of Co-founders": data.numberOfCoFounders,
      "Team Size": data.teamSize,
      "Net Revenue LTM (USD)": data.netRevenueLTM,
      "Last Month Net Revenue (USD)": data.lastMonthNetRevenue,
      "Total Capital Raised (USD)": data.totalCapitalRaised,
      "Round Stage": data.roundStage,
      Instrument: data.instrument,
      "Round Size (USD)": data.roundSize,
      "Pre-money Valuation / CAP (USD)": data.preMoneyValuationCap,
      ...(data.discountRate != null && { "Discount Rate (%)": data.discountRate }),
      ...(data.interestRate != null && { "Interest Rate (%)": data.interestRate }),
      "Pitch Deck Link": data.pitchDeckLink,
      "How did you find us?": data.howDidYouFindUs,
      Status: "New",
      "UTM Source": data.utmSource || "",
      "UTM Medium": data.utmMedium || "",
      "UTM Campaign": data.utmCampaign || "",
      "Submitted At": new Date().toISOString(),
    },
    { typecast: true }
  );

  return record.id;
}
