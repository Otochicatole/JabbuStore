import { NextResponse, type NextRequest } from "next/server";

import { resolveRequestLocale } from "@/shared/i18n/localeDetection";
import {
  isLocale,
  LOCALE_PREFERENCE_COOKIE,
  LOCALE_REQUEST_HEADER,
} from "@/shared/i18n/routing";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (isLocale(firstSegment)) {
    const pathWithoutLocale = pathname.replace(`/${firstSegment}`, "") || "/";
    if (pathWithoutLocale.startsWith("/admin/panel")) {
      const adminToken = request.cookies.get("admin_token")?.value;
      if (!adminToken) {
        const url = request.nextUrl.clone();
        url.pathname = `/${firstSegment}/admin/login`;
        url.search = "";
        return NextResponse.redirect(url);
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(LOCALE_REQUEST_HEADER, firstSegment);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const savedPreference = request.cookies.get(LOCALE_PREFERENCE_COOKIE)?.value;
  const locale = resolveRequestLocale(savedPreference, request.headers);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  url.search = search;

  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set(
    "Vary",
    "Cookie, Accept-Language, X-Vercel-IP-Country, CF-IPCountry, CloudFront-Viewer-Country, X-Geo-Country, X-Country-Code, X-Country",
  );
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
