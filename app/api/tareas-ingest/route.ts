import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TareaSchema } from "@/lib/portfolio/portfolioSchemas";
import { getAllTareas } from "@/lib/portfolio/tareasData";
import { upsertExternalTarea } from "@/lib/portfolio/tareasStore";
import { checkIngestRateLimit } from "@/lib/ratelimit";

const BodySchema = z.object({
  tareas: z.array(TareaSchema).min(1),
});

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Public endpoint (not behind proxy.ts's cookie auth — this is meant to
 * be called from other repos, not a browser session) that lets the
 * "extraer-tareas" skill push tareas straight into the /admin/tareas
 * board's Redis store. Auth is a single bearer secret scoped only to
 * this endpoint (TAREAS_INGEST_SECRET) — deliberately not the shared
 * Upstash credentials, so a leak from some other project can't reach
 * anything beyond "can submit a tarea".
 */
export async function POST(req: NextRequest) {
  const expected = process.env.TAREAS_INGEST_SECRET;
  if (!expected) {
    return NextResponse.json({ message: "Ingest not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIP(req);
  const { allowed, reset } = await checkIngestRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": reset ? String(Math.ceil((reset - Date.now()) / 1000)) : "600",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Tareas inválidas", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const moovIds = new Set(getAllTareas().map((t) => t.id));
  const results: { id: string; status: "ok" | "error"; message?: string }[] = [];

  for (const tarea of parsed.data.tareas) {
    if (moovIds.has(tarea.id)) {
      results.push({
        id: tarea.id,
        status: "error",
        message: "Este id ya existe entre las tareas nativas de MOOV — usa un prefijo distinto.",
      });
      continue;
    }
    try {
      await upsertExternalTarea(tarea);
      results.push({ id: tarea.id, status: "ok" });
    } catch (err) {
      console.error("[tareas-ingest] failed to store tarea:", tarea.id, err);
      results.push({ id: tarea.id, status: "error", message: "No se pudo guardar" });
    }
  }

  return NextResponse.json({ results });
}
