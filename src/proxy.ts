import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/icon", "/apple-icon"]);
const PUBLIC_PREFIXES = ["/api/auth", "/api/calendar", "/api/cron"];
// Static/PWA assets the OS or browser fetches without a session
// (icon.tsx/apple-icon.tsx/manifest.ts generated routes, service worker, etc.)
const PUBLIC_ASSET_PATTERN = /\.(png|ico|svg|webmanifest|json|webp|txt|xml)$/;

// Optimistic check only: cookie present + signature valid. No DB hit here —
// real authorization happens in the data access layer (src/lib/auth.ts).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PUBLIC_ASSET_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|sw.js).*)"],
};
