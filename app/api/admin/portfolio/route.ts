import { NextRequest, NextResponse } from "next/server";
import { listPortfolioCompanies, createPortfolioCompany } from "@/lib/portfolio";

export async function GET() {
  try {
    const companies = await listPortfolioCompanies();
    return NextResponse.json({ companies });
  } catch (err) {
    console.error("[admin/portfolio] Error:", err);
    return NextResponse.json({ message: "Failed to fetch portfolio companies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const data = body as {
    name?: string;
    description?: string;
    website?: string;
    vertical?: string;
    stage?: string;
    country?: string;
    investmentYear?: number;
    logoUrl?: string;
    visible?: boolean;
  };

  if (!data.name?.trim()) {
    return NextResponse.json({ message: "Company name is required" }, { status: 400 });
  }

  try {
    const company = await createPortfolioCompany(data as { name: string });
    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error("[admin/portfolio/create] Error:", err);
    return NextResponse.json({ message: "Failed to create company" }, { status: 500 });
  }
}
