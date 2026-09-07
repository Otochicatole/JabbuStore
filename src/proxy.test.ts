import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";

import { proxy } from "./proxy";

function request(path: string, headers?: HeadersInit) {
  return new NextRequest(`https://jabbustore.com${path}`, { headers });
}

function redirectLocation(response: Response) {
  const location = response.headers.get("location");
  assert.ok(location, "expected a redirect location");
  return new URL(location, "https://jabbustore.com");
}

describe("locale proxy", () => {
  it("redirects an unlocalized deep link using the visitor country", () => {
    const response = proxy(
      request("/checkout?status=success", { "cf-ipcountry": "BR" }),
    );
    const location = redirectLocation(response);

    assert.equal(response.status, 307);
    assert.equal(location.pathname, "/br/checkout");
    assert.equal(location.search, "?status=success");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  });

  it("lets the saved manual preference override automatic detection", () => {
    const response = proxy(
      request("/", {
        "x-vercel-ip-country": "BR",
        cookie: "jabbustore_locale=es",
      }),
    );

    assert.equal(redirectLocation(response).pathname, "/es");
  });

  it("uses the browser language when no country header is available", () => {
    const response = proxy(
      request("/market", { "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" }),
    );

    assert.equal(redirectLocation(response).pathname, "/br/market");
  });

  it("does not rewrite an explicitly localized URL", () => {
    const response = proxy(
      request("/en/buy", {
        "cf-ipcountry": "AR",
        cookie: "jabbustore_locale=br",
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
  });

  it("keeps the localized admin authentication guard", () => {
    const response = proxy(request("/es/admin/panel/inventory"));

    assert.equal(response.status, 307);
    assert.equal(redirectLocation(response).pathname, "/es/admin/login");
  });

  it("leaves API and public file requests untouched", () => {
    const apiResponse = proxy(request("/api/auth/session"));
    const fileResponse = proxy(request("/logo.webp"));

    assert.equal(apiResponse.status, 200);
    assert.equal(apiResponse.headers.get("location"), null);
    assert.equal(fileResponse.status, 200);
    assert.equal(fileResponse.headers.get("location"), null);
  });
});
