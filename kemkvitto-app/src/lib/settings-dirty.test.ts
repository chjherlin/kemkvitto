import assert from "node:assert/strict";
import test from "node:test";
import { settingsAreDirty, type SettingsSnapshot } from "./settings-dirty.ts";

function saved(): SettingsSnapshot {
  return {
    brandColor: "#82c58a",
    businessName: "Ert tvätteri",
    priceList: { Kavaj: 200, __showPrices: 0 },
    garmentList: ["Kavaj"],
    serviceList: ["Pressning"],
    receiptNumber: "0001",
  };
}

test("a matching form is not dirty", () => {
  assert.equal(settingsAreDirty(saved(), saved()), false);
});

test("colour, prices, garments, services and the receipt number each count", () => {
  const base = saved();
  assert.equal(settingsAreDirty({ ...base, brandColor: "#6BA6D2" }, base), true);
  assert.equal(settingsAreDirty({ ...base, brandColor: "#82C58A" }, base), false);
  assert.equal(settingsAreDirty({ ...base, businessName: "Annat" }, base), true);
  assert.equal(settingsAreDirty({ ...base, priceList: { Kavaj: 210, __showPrices: 0 } }, base), true);
  assert.equal(settingsAreDirty({ ...base, priceList: { Kavaj: 200 } }, base), true);
  assert.equal(settingsAreDirty({ ...base, garmentList: ["Kavaj", "Byxor"] }, base), true);
  assert.equal(settingsAreDirty({ ...base, serviceList: [] }, base), true);
  assert.equal(settingsAreDirty({ ...base, receiptNumber: "0002" }, base), true);
});
