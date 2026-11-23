import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_GARMENTS, DEFAULT_PRICE_LIST, visibleGarments } from "./laundry-defaults.ts";

test("shirts are three ordinary products with prices derived from one shirt price", () => {
  const shirt = DEFAULT_PRICE_LIST["Skjorta"];
  assert.equal(DEFAULT_PRICE_LIST["5 Skjortor"], shirt * 5);
  assert.equal(DEFAULT_PRICE_LIST["10 Skjortor"], shirt * 10);
  assert.ok(DEFAULT_GARMENTS.includes("Skjorta"));
  assert.ok(DEFAULT_GARMENTS.includes("5 Skjortor"));
  assert.ok(DEFAULT_GARMENTS.includes("10 Skjortor"));
});

test("legacy package labels stay hidden and a saved list is otherwise kept", () => {
  assert.deepEqual(
    visibleGarments(["Kavaj", "Skjorta ×5", "Skjorta ×10", "5 Skjortor"]),
    ["Kavaj", "5 Skjortor"]
  );
  assert.ok(visibleGarments(null).includes("10 Skjortor"));
});
