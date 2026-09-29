import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { updateTareasUser, deleteTareasUser } from "@/lib/tareasUsers";
import { canonicalProyecto } from "@/lib/portfolio/proyectos";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
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

  const { name, password, role, proyectos, status } = body as {
    name?: string;
    password?: string;
    role?: string;
    proyectos?: string[];
    status?: string;
  };

  if (role !== undefined && role !== "admin" && role !== "member") {
    return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
  }
  if (status !== undefined && status !== "active" && status !== "paused") {
    return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
  }
  if (name === undefined && !password && role === undefined && proyectos === undefined && status === undefined) {
    return NextResponse.json({ message: "Nada que actualizar" }, { status: 400 });
  }

  try {
    const user = await updateTareasUser(id, {
      name,
      password,
      role: role as "admin" | "member" | undefined,
      proyectos: Array.isArray(proyectos) ? proyectos.map(canonicalProyecto) : undefined,
      status: status as "active" | "paused" | undefined,
    });
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        proyectos: user.proyectos,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    console.error("[admin/tareas-usuarios/:id] update error:", err);
    return NextResponse.json({ message: "No se pudo actualizar el usuario" }, { status: 500 });
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
    await deleteTareasUser(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/tareas-usuarios/:id] delete error:", err);
    return NextResponse.json({ message: "No se pudo eliminar el usuario" }, { status: 500 });
  }
}
