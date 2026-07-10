import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "moov-admin-dev-secret-change-in-production"
);

const PASSWORD_HASH = "$2b$10$BDwFNTzOfq9tqXSYDM9vmuP65ABbBZU1p6f3FQjr1YSAq9tf2dF/W";

const ADMIN_USERS: Record<string, string> = {
  "admin@moov.com": PASSWORD_HASH,
  "arturo.reyes8291@gmail.com": PASSWORD_HASH,
};

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ email: string } | null> {
  const hash = ADMIN_USERS[email.toLowerCase()];
  if (!hash) return null;
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return null;
  return { email };
}

export async function signToken(payload: { email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { email: payload.email as string };
  } catch {
    return null;
  }
}
