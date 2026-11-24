import assert from "node:assert/strict";
import test from "node:test";
import {
  LAUNDRY_COUNTRIES,
  currencyAffix,
  currencySymbol,
  examplePrices,
  formatLaundryMoney,
  laundryCurrency,
  laundryPriceRule,
  garmentUnitPrice,
  SPECIAL_GARMENT,
  visibleGarments,
} from "./laundry-defaults.ts";

const SWEDEN = {
  "Rock": 250, "Kostym": 350, "Kavaj": 200, "Byxor": 150, "Kappa": 350,
  "Dräkt": 300, "Jacka": 250, "Kjol": 150, "Matta": 400,
  "Klänning": 250, "Blus": 130, "Skjorta": 80, "5 Skjortor": 150, "10 Skjortor": 250,
  "Mocka": 500, "Slips": 80, "Gardin": 200, "Vittvätt": 100,
  "Pressning": 50, "Stärkning": 30, "Vikning": 20, "Express": 100,
};

const LOCKED = {
  NO: {"Rock":275,"Kostym":385,"Kavaj":220,"Byxor":165,"Kappa":385,"Dräkt":330,"Jacka":275,"Kjol":165,"Matta":440,"Klänning":275,"Blus":145,"Skjorta":90,"5 Skjortor":170,"10 Skjortor":280,"Mocka":550,"Slips":90,"Gardin":220,"Vittvätt":110,"Pressning":55,"Stärkning":35,"Vikning":20,"Express":110},
  DK: {"Rock":175,"Kostym":245,"Kavaj":140,"Byxor":105,"Kappa":245,"Dräkt":210,"Jacka":175,"Kjol":105,"Matta":280,"Klänning":175,"Blus":90,"Skjorta":55,"5 Skjortor":105,"10 Skjortor":170,"Mocka":350,"Slips":55,"Gardin":140,"Vittvätt":70,"Pressning":35,"Stärkning":20,"Vikning":15,"Express":70},
  FI: {"Rock":21.5,"Kostym":30.5,"Kavaj":17.5,"Byxor":13,"Kappa":30.5,"Dräkt":26,"Jacka":21.5,"Kjol":13,"Matta":35,"Klänning":21.5,"Blus":11.5,"Skjorta":7,"5 Skjortor":13,"10 Skjortor":22,"Mocka":43.5,"Slips":7,"Gardin":17.5,"Vittvätt":8.5,"Pressning":4.5,"Stärkning":2.5,"Vikning":1.5,"Express":8.5},
  GB: {"Rock":18.5,"Kostym":26,"Kavaj":15,"Byxor":11,"Kappa":26,"Dräkt":22.5,"Jacka":18.5,"Kjol":11,"Matta":30,"Klänning":18.5,"Blus":9.5,"Skjorta":6,"5 Skjortor":11.5,"10 Skjortor":19,"Mocka":37.5,"Slips":6,"Gardin":15,"Vittvätt":7.5,"Pressning":3.5,"Stärkning":2,"Vikning":1.5,"Express":7.5},
  US: {"Rock":24.5,"Kostym":34.5,"Kavaj":19.5,"Byxor":14.5,"Kappa":34.5,"Dräkt":29.5,"Jacka":24.5,"Kjol":14.5,"Matta":39,"Klänning":24.5,"Blus":12.5,"Skjorta":8,"5 Skjortor":15,"10 Skjortor":25,"Mocka":49,"Slips":8,"Gardin":19.5,"Vittvätt":10,"Pressning":5,"Stärkning":3,"Vikning":2,"Express":10},
  JP: {"Rock":3887,"Kostym":5442,"Kavaj":3110,"Byxor":2332,"Kappa":5442,"Dräkt":4665,"Jacka":3887,"Kjol":2332,"Matta":6220,"Klänning":3887,"Blus":2021,"Skjorta":1244,"5 Skjortor":2333,"10 Skjortor":3888,"Mocka":7775,"Slips":1244,"Gardin":3110,"Vittvätt":1555,"Pressning":777,"Stärkning":466,"Vikning":311,"Express":1555},
  MX: {"Rock":467,"Kostym":654,"Kavaj":374,"Byxor":280,"Kappa":654,"Dräkt":561,"Jacka":467,"Kjol":280,"Matta":748,"Klänning":467,"Blus":243,"Skjorta":150,"5 Skjortor":281,"10 Skjortor":469,"Mocka":934,"Slips":150,"Gardin":374,"Vittvätt":187,"Pressning":93,"Stärkning":56,"Vikning":37,"Express":187},
  BR: {"Rock":145.5,"Kostym":203.5,"Kavaj":116.5,"Byxor":87.5,"Kappa":203.5,"Dräkt":174.5,"Jacka":145.5,"Kjol":87.5,"Matta":233,"Klänning":145.5,"Blus":75.5,"Skjorta":46.5,"5 Skjortor":87,"10 Skjortor":145.5,"Mocka":291,"Slips":46.5,"Gardin":116.5,"Vittvätt":58,"Pressning":29,"Stärkning":17.5,"Vikning":11.5,"Express":58},
  PL: {"Rock":99.5,"Kostym":139,"Kavaj":79.5,"Byxor":59.5,"Kappa":139,"Dräkt":119.5,"Jacka":99.5,"Kjol":59.5,"Matta":159,"Klänning":99.5,"Blus":51.5,"Skjorta":32,"5 Skjortor":60,"10 Skjortor":100,"Mocka":199,"Slips":32,"Gardin":79.5,"Vittvätt":40,"Pressning":20,"Stärkning":12,"Vikning":8,"Express":40},
  TR: {"Rock":1239,"Kostym":1735,"Kavaj":991,"Byxor":744,"Kappa":1735,"Dräkt":1487,"Jacka":1239,"Kjol":744,"Matta":1983,"Klänning":1239,"Blus":644,"Skjorta":397,"5 Skjortor":744,"10 Skjortor":1241,"Mocka":2478,"Slips":397,"Gardin":991,"Vittvätt":496,"Pressning":248,"Stärkning":149,"Vikning":99,"Express":496},
  IN: {"Rock":2271,"Kostym":3179,"Kavaj":1817,"Byxor":1363,"Kappa":3179,"Dräkt":2725,"Jacka":2271,"Kjol":1363,"Matta":3633,"Klänning":2271,"Blus":1181,"Skjorta":727,"5 Skjortor":1363,"10 Skjortor":2272,"Mocka":4542,"Slips":727,"Gardin":1817,"Vittvätt":908,"Pressning":454,"Stärkning":273,"Vikning":182,"Express":908},
};

test("Sweden keeps today's list and the stated shirt packages", () => {
  assert.deepEqual(examplePrices("SE"), SWEDEN);
  assert.deepEqual(examplePrices("se"), SWEDEN);
  assert.equal(formatLaundryMoney(80, "SE"), "80 kr");
  assert.equal(formatLaundryMoney(7.5, "SE"), "7,50 kr");
});

test("Norway, Denmark and Finland stay on the previous lists", () => {
  assert.deepEqual(examplePrices("NO"), LOCKED.NO);
  assert.deepEqual(examplePrices("DK"), LOCKED.DK);
  assert.deepEqual(examplePrices("FI"), LOCKED.FI);
  assert.equal(formatLaundryMoney(7, "FI"), "7 €");
  assert.equal(formatLaundryMoney(7.5, "FI"), "7,50 €");
  assert.equal(formatLaundryMoney(90, "NO"), "90 kr");
  assert.equal(formatLaundryMoney(55, "DK"), "55 kr");
});

test("every euro country shares Finland's list and the trailing euro sign", () => {
  for (const code of ["DE", "FR", "ES", "PT", "IT", "NL"]) {
    assert.equal(laundryCurrency(code), "EUR");
    assert.deepEqual(examplePrices(code), LOCKED.FI);
    assert.equal(formatLaundryMoney(7, code), "7 €");
    assert.equal(formatLaundryMoney(7.5, code), "7,50 €");
    assert.equal(laundryPriceRule(code).step, 0.5);
  }
});

test("each other sold country has its own currency, format and example list", () => {
  const expectFormat: Record<string, { currency: string; symbol: string; position: "before" | "after"; shirt: string; fraction: string }> = {
    GB: { currency: "GBP", symbol: "£", position: "before", shirt: "£6.00", fraction: "£7.50" },
    US: { currency: "USD", symbol: "$", position: "before", shirt: "$8.00", fraction: "$7.50" },
    JP: { currency: "JPY", symbol: "¥", position: "before", shirt: "¥1244", fraction: "¥8" },
    MX: { currency: "MXN", symbol: "MX$", position: "before", shirt: "MX$150.00", fraction: "MX$7.50" },
    BR: { currency: "BRL", symbol: "R$", position: "before", shirt: "R$ 46,50", fraction: "R$ 7,50" },
    PL: { currency: "PLN", symbol: "zł", position: "after", shirt: "32,00 zł", fraction: "7,50 zł" },
    TR: { currency: "TRY", symbol: "₺", position: "before", shirt: "₺397", fraction: "₺8" },
    IN: { currency: "INR", symbol: "₹", position: "before", shirt: "₹727", fraction: "₹8" },
  };
  for (const [code, expected] of Object.entries(expectFormat)) {
    assert.equal(laundryCurrency(code), expected.currency);
    assert.equal(currencySymbol(code), expected.symbol);
    assert.equal(currencyAffix(code).position, expected.position);
    assert.deepEqual(examplePrices(code), LOCKED[code as keyof typeof LOCKED]);
    assert.equal(formatLaundryMoney(examplePrices(code).Skjorta, code), expected.shirt);
    assert.equal(formatLaundryMoney(7.5, code), expected.fraction);
  }
});

test("an unknown or missing country stays on the Swedish list", () => {
  assert.equal(laundryCurrency("ZZ"), "SEK");
  assert.equal(laundryCurrency(null), "SEK");
  assert.equal(laundryCurrency(undefined), "SEK");
  assert.equal(currencySymbol("ZZ"), "kr");
  assert.deepEqual(examplePrices("ZZ"), SWEDEN);
  assert.deepEqual(examplePrices(null), SWEDEN);
  assert.equal(formatLaundryMoney(80, null), "80 kr");
});

test("shirt packages stay within half a rounding step of 1.875 and 3.125", () => {
  for (const code of LAUNDRY_COUNTRIES) {
    const prices = examplePrices(code);
    const step = laundryPriceRule(code).step;
    const shirt = prices.Skjorta;
    assert.ok(Math.abs(prices["5 Skjortor"] - shirt * 150 / 80) <= step / 2 + 1e-9, code);
    assert.ok(Math.abs(prices["10 Skjortor"] - shirt * 250 / 80) <= step / 2 + 1e-9, code);
    for (const amount of Object.values(prices)) {
      const units = amount / step;
      assert.ok(Math.abs(units - Math.round(units)) < 1e-6, `${code} ${amount}`);
    }
  }
  assert.equal(LAUNDRY_COUNTRIES.length, 18);
});

test("example prices are a copy, so a caller cannot change the seed", () => {
  const first = examplePrices("GB");
  first.Skjorta = 1;
  assert.equal(examplePrices("GB").Skjorta, 6);
});

test("legacy package labels stay hidden and Annat/Special is always last", () => {
  assert.deepEqual(
    visibleGarments(["Kavaj", "Skjorta ×5", "5 Skjortor"]),
    ["Kavaj", "5 Skjortor", SPECIAL_GARMENT]
  );
});

test("Annat/Special is last for an older saved list and never affects the total", () => {
  const shown = visibleGarments(["Byxor", "Kavaj"]);
  assert.equal(shown.at(-1), SPECIAL_GARMENT);
  assert.equal(shown.filter((name) => name === SPECIAL_GARMENT).length, 1);
  assert.equal(garmentUnitPrice(SPECIAL_GARMENT, { [SPECIAL_GARMENT]: 80, Kavaj: 200 }), 0);
  assert.equal(garmentUnitPrice("Kavaj", { Kavaj: 200 }), 200);
  const quantities: Record<string, number> = { Kavaj: 2, [SPECIAL_GARMENT]: 4 };
  const total = Object.entries(quantities).reduce(
    (sum, [name, qty]) => sum + qty * garmentUnitPrice(name, { Kavaj: 200, [SPECIAL_GARMENT]: 80 }),
    0
  );
  assert.equal(total, 400);
  const prices = examplePrices("SE");
  assert.equal("Poplin" in prices, false);
  assert.equal("Jumper" in prices, false);
});
