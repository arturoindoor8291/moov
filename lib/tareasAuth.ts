import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import {
  getTareasUserByEmail,
  touchTareasUserLogin,
  type TareasUserRole,
} from "@/lib/tareasUsers";

const SECRET = new TextEncoder().encode(
  process.env.TAREAS_JWT_SECRET ?? "moov-tareas-dev-secret-change-in-production"
);

export type TareasTokenPayload = {
  name: string;
  email: string;
  role: TareasUserRole;
  proyectos: string[];
};

export async function verifyTareasCredentials(
  email: string,
  password: string
): Promise<TareasTokenPayload | null> {
  const user = await getTareasUserByEmail(email);
  if (!user) return null;
  if (user.status !== "active") return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await touchTareasUserLogin(user.id).catch(() => {
    // Non-critical — don't block login if this write fails.
  });

  return { name: user.name, email: user.email, role: user.role, proyectos: user.proyectos };
}

export async function signTareasToken(payload: TareasTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyTareasToken(token: string): Promise<TareasTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      name: (payload.name as string | undefined) ?? "",
      email: payload.email as string,
      role: payload.role as TareasUserRole,
      proyectos: (payload.proyectos as string[] | undefined) ?? [],
    };
  } catch {
    return null;
  }
}
