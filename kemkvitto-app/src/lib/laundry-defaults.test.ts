import assert from "node:assert/strict";
import test from "node:test";
import {
  currencySymbol,
  examplePrices,
  formatLaundryMoney,
  laundryCurrency,
  visibleGarments,
} from "./laundry-defaults.ts";

test("Sweden keeps today's list and the stated shirt packages", () => {
  const prices = examplePrices("SE");
  assert.equal(prices.Skjorta, 80);
  assert.equal(prices["5 Skjortor"], 150);
  assert.equal(prices["10 Skjortor"], 250);
  assert.equal(prices.Blus, 130);
  assert.equal(prices.Vikning, 20);
});

test("other Nordic packages stay within one rounding step of the Swedish ratio", () => {
  for (const code of ["NO", "DK", "FI"]) {
    const prices = examplePrices(code);
    const shirt = prices.Skjorta;
    const step = code === "FI" ? 0.5 : 5;
    assert.ok(Math.abs(prices["5 Skjortor"] - shirt * 150 / 80) <= step / 2);
    assert.ok(Math.abs(prices["10 Skjortor"] - shirt * 250 / 80) <= step / 2);
  }
  assert.equal(examplePrices("FI").Skjorta, 7);
  assert.equal(examplePrices("FI")["5 Skjortor"], 13);
  assert.equal(examplePrices("FI")["10 Skjortor"], 22);
  assert.equal(formatLaundryMoney(7, "FI"), "7 €");
  assert.equal(formatLaundryMoney(7.5, "FI"), "7,50 €");
});

test("currency comes from the country, and anything else stays kronor", () => {
  assert.equal(laundryCurrency("SE"), "SEK");
  assert.equal(laundryCurrency("no"), "NOK");
  assert.equal(laundryCurrency("DK"), "DKK");
  assert.equal(laundryCurrency("FI"), "EUR");
  assert.equal(laundryCurrency("DE"), "SEK");
  assert.equal(laundryCurrency(null), "SEK");
  assert.equal(currencySymbol("FI"), "€");
  assert.equal(currencySymbol("DE"), "kr");
  assert.equal(formatLaundryMoney(80, "SE"), "80 kr");
  assert.equal(examplePrices("DE").Skjorta, 80);
  assert.equal(examplePrices(null).Skjorta, 80);
});

test("legacy package labels stay hidden", () => {
  assert.deepEqual(
    visibleGarments(["Kavaj", "Skjorta ×5", "5 Skjortor"]),
    ["Kavaj", "5 Skjortor"]
  );
});
