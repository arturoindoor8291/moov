import { NextResponse } from "next/server";
import { listApplications } from "@/lib/airtable";

export async function GET() {
  try {
    const applications = await listApplications();
    return NextResponse.json({ applications });
  } catch (err) {
    console.error("[admin/applications] Error:", err);
    return NextResponse.json({ message: "Failed to fetch applications" }, { status: 500 });
  }
}
