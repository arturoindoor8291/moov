import Airtable from "airtable";
import bcrypt from "bcryptjs";
import { canonicalProyecto } from "./portfolio/proyectos";

const TAREAS_USERS_TABLE = process.env.TAREAS_USERS_TABLE_NAME || "TareasUsers";

function getBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials are not configured.");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

export type TareasUserRole = "admin" | "member";
export type TareasUserStatus = "active" | "paused";

export interface TareasUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: TareasUserRole;
  // Nombres canónicos de proyecto (ver lib/portfolio/proyectos.ts). Se
  // ignora cuando role === "admin": un admin de tareas ve los 4 proyectos.
  proyectos: string[];
  status: TareasUserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateTareasUserInput {
  name: string;
  email: string;
  password: string;
  role: TareasUserRole;
  proyectos: string[];
}

export interface UpdateTareasUserInput {
  name?: string;
  password?: string;
  role?: TareasUserRole;
  proyectos?: string[];
  status?: TareasUserStatus;
}

// Proyectos se guarda como texto separado por comas (no "Multiple select")
// para no depender de que las opciones del campo en Airtable coincidan
// exactamente con CANONICAL_PROYECTOS — más robusto ante typos o proyectos
// nuevos que se agreguen después sin tocar el schema de Airtable.
function recordToUser(record: Airtable.Record<Airtable.FieldSet>): TareasUserRecord {
  const f = record.fields;
  const proyectosRaw = (f["Proyectos"] as string) || "";
  return {
    id: record.id,
    name: (f["Name"] as string) || "",
    email: ((f["Email"] as string) || "").toLowerCase(),
    passwordHash: (f["PasswordHash"] as string) || "",
    role: ((f["Role"] as string) || "member") as TareasUserRole,
    proyectos: proyectosRaw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map(canonicalProyecto),
    status: ((f["Status"] as string) || "active") as TareasUserStatus,
    createdAt: (f["CreatedAt"] as string) || new Date().toISOString(),
    lastLoginAt: (f["LastLoginAt"] as string) || null,
  };
}

export async function listTareasUsers(): Promise<TareasUserRecord[]> {
  const base = getBase();
  const records = await base(TAREAS_USERS_TABLE)
    .select({ sort: [{ field: "CreatedAt", direction: "asc" }] })
    .all();
  return records.map(recordToUser);
}

export async function getTareasUserByEmail(email: string): Promise<TareasUserRecord | null> {
  const base = getBase();
  const normalized = email.trim().toLowerCase();
  const records = await base(TAREAS_USERS_TABLE)
    .select({
      filterByFormula: `LOWER({Email}) = "${normalized.replace(/"/g, '\\"')}"`,
      maxRecords: 1,
    })
    .all();
  if (records.length === 0) return null;
  return recordToUser(records[0]);
}

export async function createTareasUser(data: CreateTareasUserInput): Promise<TareasUserRecord> {
  const base = getBase();
  const existing = await getTareasUserByEmail(data.email);
  if (existing) {
    throw new Error("Ya existe un usuario con ese correo.");
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const record = await base(TAREAS_USERS_TABLE).create(
    {
      Name: data.name.trim(),
      Email: data.email.trim().toLowerCase(),
      PasswordHash: passwordHash,
      Role: data.role,
      Proyectos: data.proyectos.map(canonicalProyecto).join(", "),
      Status: "active",
      CreatedAt: new Date().toISOString(),
    },
    { typecast: true }
  );
  return recordToUser(record);
}

export async function updateTareasUser(
  id: string,
  data: UpdateTareasUserInput
): Promise<TareasUserRecord> {
  const base = getBase();
  const fields: Airtable.FieldSet = {};
  if (data.name !== undefined) fields["Name"] = data.name.trim();
  if (data.password) {
    fields["PasswordHash"] = await bcrypt.hash(data.password, 10);
  }
  if (data.role !== undefined) fields["Role"] = data.role;
  if (data.proyectos !== undefined) {
    fields["Proyectos"] = data.proyectos.map(canonicalProyecto).join(", ");
  }
  if (data.status !== undefined) fields["Status"] = data.status;

  const record = await base(TAREAS_USERS_TABLE).update(id, fields, { typecast: true });
  return recordToUser(record);
}

export async function deleteTareasUser(id: string): Promise<void> {
  const base = getBase();
  await base(TAREAS_USERS_TABLE).destroy(id);
}

export async function touchTareasUserLogin(id: string): Promise<void> {
  const base = getBase();
  await base(TAREAS_USERS_TABLE).update(
    id,
    { LastLoginAt: new Date().toISOString() },
    { typecast: true }
  );
}
