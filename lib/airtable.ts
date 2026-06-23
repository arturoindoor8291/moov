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
