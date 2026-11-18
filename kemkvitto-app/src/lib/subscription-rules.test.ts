import assert from "node:assert/strict";
import test from "node:test";
import {
  assessBusinessTaxId,
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
  assert.equal(subscriptionAllowsAccess("vat_missing"), false);
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

test("a VAT number is required", () => {
  assert.deepEqual(
    assessBusinessTaxId({ taxIds: [], registeredCountry: "SE", billingCountry: "SE" }),
    { ok: false, status: "vat_missing" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "eu_vat", value: "   " }],
      registeredCountry: "SE",
    }),
    { ok: false, status: "vat_missing" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "es_cif", value: "A12345678" }],
      registeredCountry: "ES",
      billingCountry: "ES",
    }),
    { ok: false, status: "vat_missing" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "no_voec", value: "123456789" }],
      registeredCountry: "NO",
    }),
    { ok: false, status: "vat_missing" }
  );
});

test("EU VAT prefix and UK or Norway types must match the registered country", () => {
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "eu_vat", value: "SE123456789123", verificationStatus: "pending" }],
      registeredCountry: "se",
      billingCountry: "SE",
    }),
    { ok: true, vatNumber: "SE123456789123", verificationStatus: "pending" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "eu_vat", value: "DE 123456789" }],
      registeredCountry: "SE",
      billingCountry: "SE",
    }),
    { ok: false, status: "country_mismatch" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "eu_vat", value: "EL123456789" }],
      registeredCountry: "GR",
      billingCountry: "GR",
    }),
    { ok: true, vatNumber: "EL123456789", verificationStatus: "unknown" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "gb_vat", value: "GB123456789", verificationStatus: "unverified" }],
      registeredCountry: "GB",
      billingCountry: "GB",
    }),
    { ok: true, vatNumber: "GB123456789", verificationStatus: "unverified" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "eu_vat", value: "XI123456789" }],
      registeredCountry: "GB",
      billingCountry: "GB",
    }),
    { ok: false, status: "country_mismatch" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "no_vat", value: "123456789MVA" }],
      registeredCountry: "NO",
      billingCountry: "NO",
    }),
    { ok: true, vatNumber: "123456789MVA", verificationStatus: "unknown" }
  );
});

test("a collected tax ID is accepted when its country cannot be read", () => {
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [{ type: "in_gst", value: "12ABCDE3456FGZH", verificationStatus: "unavailable" }],
      registeredCountry: "IN",
      billingCountry: "IN",
    }),
    { ok: true, vatNumber: "12ABCDE3456FGZH", verificationStatus: "unavailable" }
  );
  assert.deepEqual(
    assessBusinessTaxId({
      taxIds: [
        { type: "eu_vat", value: "FRAB123456789" },
        { type: "eu_vat", value: "SE123456789123", verificationStatus: "verified" },
      ],
      registeredCountry: "SE",
      billingCountry: "SE",
    }),
    { ok: true, vatNumber: "SE123456789123", verificationStatus: "verified" }
  );
});

test("price notice is at least 30 days out", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  const at = priceNoticeEffectiveAt(from);
  assert.equal(at.getTime() - from.getTime(), 30 * 24 * 60 * 60 * 1000);
});
