import { NextRequest, NextResponse } from "next/server";
import { updatePortfolioCompany, deletePortfolioCompany } from "@/lib/portfolio";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  try {
    const company = await updatePortfolioCompany(id, body as Parameters<typeof updatePortfolioCompany>[1]);
    return NextResponse.json({ company });
  } catch (err) {
    console.error("[admin/portfolio/update] Error:", err);
    return NextResponse.json({ message: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deletePortfolioCompany(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/portfolio/delete] Error:", err);
    return NextResponse.json({ message: "Failed to delete company" }, { status: 500 });
  }
}
