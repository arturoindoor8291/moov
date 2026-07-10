import { NextRequest, NextResponse } from "next/server";
import { verifyPortfolioCredentials, signPortfolioToken } from "@/lib/portfolioAuth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body as { username?: string; password?: string };
  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = await verifyPortfolioCredentials(username, password);
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = await signPortfolioToken(user);

  const response = NextResponse.json({ success: true, role: user.role });
  response.cookies.set("portfolio_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return response;
}
