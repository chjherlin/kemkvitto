import assert from "node:assert/strict";
import test from "node:test";
import {
  countries,
  lowestMonthlyPriceEur,
  monthlyPriceEur,
  pricingConfig,
  roundHalfUp,
  yearlyPriceEur,
} from "./pricing.ts";

const expectedMonthly: Record<string, number> = {
  SE: 6.5,
  NO: 8,
  DK: 7,
  FI: 6,
  DE: 6.5,
  FR: 6,
  ES: 5.5,
  PT: 5.5,
  IT: 6,
  GB: 6,
  US: 7,
  JP: 5.5,
  MX: 4,
  BR: 3.5,
  PL: 5.5,
  NL: 7,
  TR: 5,
  IN: 3,
};

test("Excel half-up rounding", () => {
  assert.equal(roundHalfUp(1.25, 0.5), 1.5);
  assert.equal(roundHalfUp(6.5, 0.5), 6.5);
  assert.equal(roundHalfUp(2.5, 0.5), 2.5);
});

test("sheet country prices", () => {
  assert.equal(countries.length, Object.keys(expectedMonthly).length);
  for (const [code, expected] of Object.entries(expectedMonthly)) {
    assert.equal(monthlyPriceEur(code), expected, code);
  }
});

test("Sweden is the reference price", () => {
  assert.equal(monthlyPriceEur("SE"), pricingConfig.basePriceEur);
});

test("yearly charge is twelve months minus the discount", () => {
  assert.equal(yearlyPriceEur("SE"), 62.4);
  assert.equal(yearlyPriceEur("NO"), 76.8);
  assert.equal(yearlyPriceEur("IN"), 28.8);
});

test("the from-price is the lowest configured monthly price", () => {
  const lowest = lowestMonthlyPriceEur();
  for (const country of countries) {
    const price = monthlyPriceEur(country.code);
    assert.ok(price != null && price >= lowest);
  }
  assert.equal(lowest, Math.min(...countries.map((country) => monthlyPriceEur(country.code) as number)));
});

test("unknown countries are not sold", () => {
  assert.equal(monthlyPriceEur("AR"), null);
  assert.equal(yearlyPriceEur("XX"), null);
});
