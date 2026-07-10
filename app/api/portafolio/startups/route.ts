import { NextResponse } from "next/server";
import { getAllStartups } from "@/lib/portfolio/portfolioData";

export async function GET() {
  return NextResponse.json({ startups: getAllStartups() });
}
