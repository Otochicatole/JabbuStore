import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
  const forwardedOrigin = host ? `${protocol}://${host}` : requestUrl.origin;
  const allowedHosts = new Set([
    requestUrl.host,
    host,
    forwardedHost,
    new URL(forwardedOrigin).host,
  ].filter((value): value is string => Boolean(value)));
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (originHost && !allowedHosts.has(originHost)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const actor = body?.actor === "ADMIN" ? "ADMIN" : "USER";
  const cookieName = actor === "ADMIN" ? "admin_token" : "auth_token";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backendBase = (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001/api"
  ).replace(/\/$/, "");

  const response = await fetch(`${backendBase}/tickets/socket-token`, {
    method: "POST",
    headers: {
      Cookie: `${cookieName}=${encodeURIComponent(token)}`,
      "Content-Type": "application/json",
      "X-Ticket-Actor": actor,
      "X-Tunnel-Skip-AntiPhishing-Page": "true",
    },
    body: JSON.stringify({ actor }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ error: "Token exchange failed" }));
  return NextResponse.json(data, {
    status: response.status,
    headers: { "Cache-Control": "no-store" },
  });
}
