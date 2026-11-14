import assert from "node:assert/strict";
import test from "node:test";
import {
  billingCountryMatches,
  priceNoticeEffectiveAt,
  subscriptionAllowsAccess,
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

test("price notice is at least 30 days out", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  const at = priceNoticeEffectiveAt(from);
  assert.equal(at.getTime() - from.getTime(), 30 * 24 * 60 * 60 * 1000);
});
