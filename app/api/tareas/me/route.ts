import { NextRequest, NextResponse } from "next/server";
import { verifyTareasToken } from "@/lib/tareasAuth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("tareas_token")?.value;
  const user = token ? await verifyTareasToken(token) : null;
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(user);
}
