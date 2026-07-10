import { NextRequest, NextResponse } from "next/server";
import { getStartupById } from "@/lib/portfolio/portfolioData";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const startup = getStartupById(id);
  if (!startup) {
    return NextResponse.json({ message: "Startup not found" }, { status: 404 });
  }
  return NextResponse.json(startup);
}
