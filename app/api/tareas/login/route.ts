import { NextRequest, NextResponse } from "next/server";
import { verifyTareasCredentials, signTareasToken } from "@/lib/tareasAuth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json(
      { message: "Correo y contraseña son requeridos" },
      { status: 400 }
    );
  }

  const user = await verifyTareasCredentials(email, password);
  if (!user) {
    return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
  }

  const token = await signTareasToken(user);

  const response = NextResponse.json({ success: true, role: user.role, proyectos: user.proyectos });
  response.cookies.set("tareas_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return response;
}
