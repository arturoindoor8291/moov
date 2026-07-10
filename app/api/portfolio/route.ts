import { NextResponse } from "next/server";
import { listVisiblePortfolioCompanies } from "@/lib/portfolio";

export async function GET() {
  try {
    const companies = await listVisiblePortfolioCompanies();
    return NextResponse.json({ companies });
  } catch (err) {
    console.error("[portfolio] Error:", err);
    return NextResponse.json({ companies: [] });
  }
}
