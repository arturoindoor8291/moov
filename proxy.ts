import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifyPortfolioToken } from "@/lib/portfolioAuth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login"];

const PUBLIC_PORTAFOLIO_PATHS = ["/portafolio/login", "/api/portafolio/login"];
const ADMIN_ONLY_PORTAFOLIO_PATHS = [
  "/portafolio/usuarios",
  "/api/portafolio/users",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPath =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPortafolioPath =
    pathname.startsWith("/portafolio") || pathname.startsWith("/api/portafolio");

  if (isAdminPath) {
    return handleAdminAuth(req, pathname);
  }

  if (isPortafolioPath) {
    return handlePortafolioAuth(req, pathname);
  }

  return NextResponse.next();
}

async function handleAdminAuth(req: NextRequest, pathname: string) {
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyToken(token);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("admin_token");
    return response;
  }

  return NextResponse.next();
}

async function handlePortafolioAuth(req: NextRequest, pathname: string) {
  const isPublic = PUBLIC_PORTAFOLIO_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get("portfolio_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/portafolio/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyPortfolioToken(token);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/portafolio/login", req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("portfolio_token");
    return response;
  }

  const isAdminOnly = ADMIN_ONLY_PORTAFOLIO_PATHS.some((p) =>
    pathname.startsWith(p)
  );
  if (isAdminOnly && user.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const homeUrl = new URL("/portafolio", req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/portafolio/:path*",
    "/api/portafolio/:path*",
  ],
};
