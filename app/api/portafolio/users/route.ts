import { NextRequest, NextResponse } from "next/server";
import { verifyPortfolioToken } from "@/lib/portfolioAuth";
import { listPortfolioUsers, createPortfolioUser } from "@/lib/portfolioUsers";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("portfolio_token")?.value;
  const user = token ? await verifyPortfolioToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  // Re-check role here even though proxy.ts already gates this path —
  // Next.js recommends not relying on Proxy alone for authorization.
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await listPortfolioUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (err) {
    console.error("[portafolio/users] list error:", err);
    return NextResponse.json({ message: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { username, password, role } = body as {
    username?: string;
    password?: string;
    role?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 }
    );
  }
  if (role !== "admin" && role !== "viewer") {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }

  try {
    const user = await createPortfolioUser({ username, password, role });
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ message }, { status: 400 });
  }
}
