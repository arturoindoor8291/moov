import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { listTareasUsers, createTareasUser } from "@/lib/tareasUsers";
import { canonicalProyecto } from "@/lib/portfolio/proyectos";

async function requireAdmin(req: NextRequest) {
  // Re-check aquí aunque proxy.ts ya protege /api/admin/:path* — Next.js
  // recomienda no depender solo del Proxy para autorización.
  const token = req.cookies.get("admin_token")?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await listTareasUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        proyectos: u.proyectos,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (err) {
    console.error("[admin/tareas-usuarios] list error:", err);
    return NextResponse.json({ message: "No se pudieron cargar los usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { name, email, password, role, proyectos } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    proyectos?: string[];
  };

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "Nombre, correo y contraseña son requeridos" },
      { status: 400 }
    );
  }
  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
  }

  try {
    const user = await createTareasUser({
      name,
      email,
      password,
      role,
      proyectos: Array.isArray(proyectos) ? proyectos.map(canonicalProyecto) : [],
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
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear el usuario";
    return NextResponse.json({ message }, { status: 400 });
  }
}
