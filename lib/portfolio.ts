import Airtable from "airtable";

const PORTFOLIO_TABLE = process.env.PORTFOLIO_TABLE_NAME || "Portfolio";

function getBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials are not configured.");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

export interface PortfolioCompany {
  id: string;
  name: string;
  description: string;
  website: string;
  vertical: string;
  stage: string;
  country: string;
  investmentYear: number | null;
  logoUrl: string;
  visible: boolean;
  createdAt: string;
}

export interface PortfolioCompanyInput {
  name: string;
  description?: string;
  website?: string;
  vertical?: string;
  stage?: string;
  country?: string;
  investmentYear?: number | null;
  logoUrl?: string;
  visible?: boolean;
}

function recordToCompany(record: Airtable.Record<Airtable.FieldSet>): PortfolioCompany {
  const f = record.fields;
  return {
    id: record.id,
    name: (f["Name"] as string) || "",
    description: (f["Description"] as string) || "",
    website: (f["Website"] as string) || "",
    vertical: (f["Vertical"] as string) || "",
    stage: (f["Stage"] as string) || "",
    country: (f["Country"] as string) || "",
    investmentYear: (f["Investment Year"] as number) || null,
    logoUrl: (f["Logo URL"] as string) || "",
    visible: !!(f["Visible"] as boolean),
    createdAt: (f["Created At"] as string) || new Date().toISOString(),
  };
}

export async function listPortfolioCompanies(): Promise<PortfolioCompany[]> {
  const base = getBase();
  const records = await base(PORTFOLIO_TABLE)
    .select({ sort: [{ field: "Name", direction: "asc" }] })
    .all();
  return records.map(recordToCompany);
}

export async function listVisiblePortfolioCompanies(): Promise<PortfolioCompany[]> {
  const base = getBase();
  const records = await base(PORTFOLIO_TABLE)
    .select({
      filterByFormula: "{Visible} = TRUE()",
      sort: [{ field: "Investment Year", direction: "desc" }],
    })
    .all();
  return records.map(recordToCompany);
}

export async function createPortfolioCompany(
  data: PortfolioCompanyInput
): Promise<PortfolioCompany> {
  const base = getBase();
  const record = await base(PORTFOLIO_TABLE).create(
    {
      Name: data.name,
      Description: data.description || "",
      Website: data.website || "",
      Vertical: data.vertical || "",
      Stage: data.stage || "",
      Country: data.country || "",
      ...(data.investmentYear != null && { "Investment Year": data.investmentYear }),
      "Logo URL": data.logoUrl || "",
      Visible: data.visible ?? false,
      "Created At": new Date().toISOString(),
    },
    { typecast: true }
  );
  return recordToCompany(record);
}

export async function updatePortfolioCompany(
  id: string,
  data: Partial<PortfolioCompanyInput>
): Promise<PortfolioCompany> {
  const base = getBase();
  const fields: Airtable.FieldSet = {};
  if (data.name !== undefined) fields["Name"] = data.name;
  if (data.description !== undefined) fields["Description"] = data.description;
  if (data.website !== undefined) fields["Website"] = data.website;
  if (data.vertical !== undefined) fields["Vertical"] = data.vertical;
  if (data.stage !== undefined) fields["Stage"] = data.stage;
  if (data.country !== undefined) fields["Country"] = data.country;
  if (data.investmentYear !== undefined) fields["Investment Year"] = data.investmentYear ?? undefined;
  if (data.logoUrl !== undefined) fields["Logo URL"] = data.logoUrl;
  if (data.visible !== undefined) fields["Visible"] = data.visible;

  const record = await base(PORTFOLIO_TABLE).update(id, fields, { typecast: true });
  return recordToCompany(record);
}

export async function deletePortfolioCompany(id: string): Promise<void> {
  const base = getBase();
  await base(PORTFOLIO_TABLE).destroy(id);
}
