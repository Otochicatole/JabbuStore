import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function splitConfig(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getHostFromUrlOrHost(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function configuredFrontendHosts() {
  const hosts = splitConfig(process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL)
    .map(getHostFromUrlOrHost)
    .filter((value): value is string => Boolean(value));
  const apiHost = getHostFromUrlOrHost(process.env.NEXT_PUBLIC_API_URL || null);
  if (apiHost?.endsWith(".devtunnels.ms")) {
    hosts.push(apiHost.replace("-3001.", "-3000."));
  }
  if (process.env.NODE_ENV !== "production") {
    hosts.push("localhost:3000", "127.0.0.1:3000");
  }
  return hosts;
}

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
    ...configuredFrontendHosts(),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase()));
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host.toLowerCase() : null;
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
      Origin: origin || forwardedOrigin,
      "X-Forwarded-Host": host || requestUrl.host,
      "X-Forwarded-Proto": protocol,
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
