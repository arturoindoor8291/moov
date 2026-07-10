import { NextResponse } from "next/server";
import { getPortfolioOverview, getUltimaActualizacion } from "@/lib/portfolio/portfolioData";

export async function GET() {
  return NextResponse.json({
    ultimaActualizacion: getUltimaActualizacion(),
    fondo: getPortfolioOverview(),
  });
}
