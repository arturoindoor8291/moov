import Airtable from "airtable";
import bcrypt from "bcryptjs";

const PORTFOLIO_USERS_TABLE =
  process.env.PORTFOLIO_USERS_TABLE_NAME || "PortfolioUsers";

function getBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials are not configured.");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

export type PortfolioUserRole = "admin" | "viewer";
export type PortfolioUserStatus = "active" | "paused";

export interface PortfolioUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: PortfolioUserRole;
  status: PortfolioUserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreatePortfolioUserInput {
  username: string;
  password: string;
  role: PortfolioUserRole;
}

export interface UpdatePortfolioUserInput {
  password?: string;
  role?: PortfolioUserRole;
  status?: PortfolioUserStatus;
}

function recordToUser(
  record: Airtable.Record<Airtable.FieldSet>
): PortfolioUserRecord {
  const f = record.fields;
  return {
    id: record.id,
    username: (f["Username"] as string) || "",
    passwordHash: (f["PasswordHash"] as string) || "",
    role: ((f["Role"] as string) || "viewer") as PortfolioUserRole,
    status: ((f["Status"] as string) || "active") as PortfolioUserStatus,
    createdAt: (f["CreatedAt"] as string) || new Date().toISOString(),
    lastLoginAt: (f["LastLoginAt"] as string) || null,
  };
}

export async function listPortfolioUsers(): Promise<PortfolioUserRecord[]> {
  const base = getBase();
  const records = await base(PORTFOLIO_USERS_TABLE)
    .select({ sort: [{ field: "CreatedAt", direction: "asc" }] })
    .all();
  return records.map(recordToUser);
}

export async function getPortfolioUserByUsername(
  username: string
): Promise<PortfolioUserRecord | null> {
  const base = getBase();
  const normalized = username.trim().toLowerCase();
  const records = await base(PORTFOLIO_USERS_TABLE)
    .select({
      filterByFormula: `LOWER({Username}) = "${normalized.replace(/"/g, '\\"')}"`,
      maxRecords: 1,
    })
    .all();
  if (records.length === 0) return null;
  return recordToUser(records[0]);
}

export async function createPortfolioUser(
  data: CreatePortfolioUserInput
): Promise<PortfolioUserRecord> {
  const base = getBase();
  const existing = await getPortfolioUserByUsername(data.username);
  if (existing) {
    throw new Error("A user with this username already exists.");
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const record = await base(PORTFOLIO_USERS_TABLE).create(
    {
      Username: data.username.trim().toLowerCase(),
      PasswordHash: passwordHash,
      Role: data.role,
      Status: "active",
      CreatedAt: new Date().toISOString(),
    },
    { typecast: true }
  );
  return recordToUser(record);
}

export async function updatePortfolioUser(
  id: string,
  data: UpdatePortfolioUserInput
): Promise<PortfolioUserRecord> {
  const base = getBase();
  const fields: Airtable.FieldSet = {};
  if (data.password) {
    fields["PasswordHash"] = await bcrypt.hash(data.password, 10);
  }
  if (data.role !== undefined) fields["Role"] = data.role;
  if (data.status !== undefined) fields["Status"] = data.status;

  const record = await base(PORTFOLIO_USERS_TABLE).update(id, fields, {
    typecast: true,
  });
  return recordToUser(record);
}

export async function deletePortfolioUser(id: string): Promise<void> {
  const base = getBase();
  await base(PORTFOLIO_USERS_TABLE).destroy(id);
}

export async function touchPortfolioUserLogin(id: string): Promise<void> {
  const base = getBase();
  await base(PORTFOLIO_USERS_TABLE).update(
    id,
    { LastLoginAt: new Date().toISOString() },
    { typecast: true }
  );
}
