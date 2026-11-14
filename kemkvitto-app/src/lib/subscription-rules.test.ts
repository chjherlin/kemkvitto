import assert from "node:assert/strict";
import test from "node:test";
import {
  billingCountryMatches,
  priceNoticeEffectiveAt,
  subscriptionAllowsAccess,
  tokenGrantsAccess,
} from "./subscription-rules.ts";

test("only active and trialing may use the app", () => {
  assert.equal(subscriptionAllowsAccess("active"), true);
  assert.equal(subscriptionAllowsAccess("trialing"), true);
  assert.equal(subscriptionAllowsAccess("past_due"), false);
  assert.equal(subscriptionAllowsAccess("canceled"), false);
  assert.equal(subscriptionAllowsAccess("country_mismatch"), false);
  assert.equal(subscriptionAllowsAccess(null), false);
});

test("billing country must match the registered country", () => {
  assert.equal(billingCountryMatches("se", "SE"), true);
  assert.equal(billingCountryMatches("IN", "SE"), false);
  assert.equal(billingCountryMatches("SE", null), false);
});

test("a fresh active token skips the database", () => {
  const now = Date.now();
  assert.equal(
    tokenGrantsAccess({ status: "active", checkedAt: now - 60_000, periodEnd: null, now }),
    true
  );
  assert.equal(
    tokenGrantsAccess({ status: "trialing", checkedAt: now, periodEnd: new Date(now + 86_400_000).toISOString(), now }),
    true
  );
});

test("stale, blocked, or expired tokens need a database read", () => {
  const now = Date.now();
  assert.equal(tokenGrantsAccess({ status: "past_due", checkedAt: now, periodEnd: null, now }), false);
  assert.equal(tokenGrantsAccess({ status: "active", checkedAt: now - 6 * 60_000, periodEnd: null, now }), false);
  assert.equal(
    tokenGrantsAccess({
      status: "active",
      checkedAt: now,
      periodEnd: new Date(now - 1000).toISOString(),
      now,
    }),
    false
  );
});

test("price notice is at least 30 days out", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  const at = priceNoticeEffectiveAt(from);
  assert.equal(at.getTime() - from.getTime(), 30 * 24 * 60 * 60 * 1000);
});
