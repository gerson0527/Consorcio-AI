import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicos = new Set(["/", "/login", "/privacidad"]);

function politica(nonce: string) {
  const desarrollo = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desarrollo}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function continuar(request: NextRequest, csp: string, nonce: string) {
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);
  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = politica(nonce);
  const { pathname } = request.nextUrl;
  if (
    publicos.has(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon" ||
    pathname === "/icon.png" ||
    pathname.startsWith("/opengraph-image")
  ) {
    return continuar(request, csp, nonce);
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    const respuesta = NextResponse.redirect(destino);
    respuesta.headers.set("Content-Security-Policy", csp);
    return respuesta;
  }

  if (pathname.startsWith("/reglas") && token.rol !== "ADMIN") {
    const respuesta = NextResponse.redirect(new URL("/clientes", request.url));
    respuesta.headers.set("Content-Security-Policy", csp);
    return respuesta;
  }
  if (
    pathname.startsWith("/auditoria") &&
    token.rol !== "AUDITOR" &&
    token.rol !== "ADMIN"
  ) {
    const respuesta = NextResponse.redirect(new URL("/clientes", request.url));
    respuesta.headers.set("Content-Security-Policy", csp);
    return respuesta;
  }
  return continuar(request, csp, nonce);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
