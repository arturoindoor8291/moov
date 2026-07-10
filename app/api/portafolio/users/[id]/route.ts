import { NextRequest, NextResponse } from "next/server";
import { verifyPortfolioToken } from "@/lib/portfolioAuth";
import { updatePortfolioUser, deletePortfolioUser } from "@/lib/portfolioUsers";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("portfolio_token")?.value;
  const user = token ? await verifyPortfolioToken(token) : null;
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { password, role, status } = body as {
    password?: string;
    role?: string;
    status?: string;
  };

  if (role !== undefined && role !== "admin" && role !== "viewer") {
    return NextResponse.json({ message: "Invalid role" }, { status: 400 });
  }
  if (status !== undefined && status !== "active" && status !== "paused") {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }
  if (!password && role === undefined && status === undefined) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  try {
    const user = await updatePortfolioUser(id, {
      password,
      role: role as "admin" | "viewer" | undefined,
      status: status as "active" | "paused" | undefined,
    });
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error("[portafolio/users/:id] update error:", err);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await deletePortfolioUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portafolio/users/:id] delete error:", err);
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
  }
}
