import { NextRequest, NextResponse } from "next/server";
import { verifyPortfolioToken } from "@/lib/portfolioAuth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("portfolio_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyPortfolioToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ username: user.username, role: user.role });
}
