import assert from "node:assert/strict";
import test from "node:test";
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
  sessionCookieName,
  sessionCookieOptions,
  sessionUsesSecureCookie,
} from "./session-cookie.ts";

test("the session lasts a year and refreshes on a one-day interval", () => {
  assert.equal(SESSION_MAX_AGE_SECONDS, 365 * 24 * 60 * 60);
  assert.equal(SESSION_UPDATE_AGE_SECONDS, 24 * 60 * 60);
});

test("the session cookie stays persistent and is Lax", () => {
  const options = sessionCookieOptions(true);
  assert.equal(options.maxAge, SESSION_MAX_AGE_SECONDS);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);
  assert.equal(options.path, "/");
  assert.equal(sessionCookieName(true), "__Secure-next-auth.session-token");
  assert.equal(sessionCookieName(false), "next-auth.session-token");
  assert.equal(sessionCookieOptions(false).secure, false);
});

test("secure cookies follow https and Vercel, not a local http dev server", () => {
  assert.equal(sessionUsesSecureCookie({ nextAuthUrl: "https://kemkvitto.vercel.app", protocol: "http:" }), true);
  assert.equal(sessionUsesSecureCookie({ vercel: "1", protocol: "http:" }), true);
  assert.equal(sessionUsesSecureCookie({ nextAuthUrl: "http://localhost:3000", protocol: "http:" }), false);
  assert.equal(sessionUsesSecureCookie({ protocol: "https:" }), true);
});
