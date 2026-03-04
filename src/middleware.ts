import { NextRequest, NextResponse } from "next/server";

// CSRF protection: verify Origin header on POST/PUT/DELETE to API routes
// Exception: webhooks (Polar sends POSTs from their servers)
export function middleware(req: NextRequest) {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "DELETE") {
    return NextResponse.next();
  }

  const path = req.nextUrl.pathname;

  // Skip webhook endpoints (they come from external services)
  if (path.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  // Only check API mutation routes
  if (!path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  // Allow requests with no origin (server-to-server, curl, etc.) — rate limiting handles abuse
  if (!origin) {
    return NextResponse.next();
  }

  // Verify origin matches our host
  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
