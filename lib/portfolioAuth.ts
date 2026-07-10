import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import {
  getPortfolioUserByUsername,
  touchPortfolioUserLogin,
  type PortfolioUserRole,
} from "@/lib/portfolioUsers";

const SECRET = new TextEncoder().encode(
  process.env.PORTFOLIO_JWT_SECRET ??
    "moov-portfolio-dev-secret-change-in-production"
);

export type PortfolioTokenPayload = {
  username: string;
  role: PortfolioUserRole;
};

export async function verifyPortfolioCredentials(
  username: string,
  password: string
): Promise<PortfolioTokenPayload | null> {
  const user = await getPortfolioUserByUsername(username);
  if (!user) return null;
  if (user.status !== "active") return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  await touchPortfolioUserLogin(user.id).catch(() => {
    // Non-critical — don't block login if this write fails.
  });

  return { username: user.username, role: user.role };
}

export async function signPortfolioToken(
  payload: PortfolioTokenPayload
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyPortfolioToken(
  token: string
): Promise<PortfolioTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      username: payload.username as string,
      role: payload.role as PortfolioUserRole,
    };
  } catch {
    return null;
  }
}
