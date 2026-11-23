import assert from "node:assert/strict";
import test from "node:test";
import { buildReceiptInsert } from "./receipt-insert.ts";

test("a saved receipt keeps the total, customer, phone, tag and services", () => {
  const row = buildReceiptInsert({
    washerId: "washer-1",
    receiptNumber: "0012",
    tagNumber: "T-9",
    garments: { Kavaj: 1 },
    deliveryDate: "2026-11-24",
    dropOffDate: "2026-11-23",
    customerName: "Anna Andersson",
    customerPhone: "0701234567",
    customerEmail: "anna@example.com",
    comment: "Kort ärm",
    amountTotal: 25000,
    services: ["pressning", "express"],
  });

  assert.equal(row.amount_total, 25000);
  assert.equal(row.customer_name, "Anna Andersson");
  assert.equal(row.customer_phone, "0701234567");
  assert.equal(row.tag_number, "T-9");
  assert.deepEqual(row.services, ["pressning", "express"]);
  assert.equal(row.drop_off_date, "2026-11-23");
  assert.equal(row.receipt_number, "0012");
  assert.equal(row.customer_email, "anna@example.com");
});

test("optional receipt fields stay on the insert even when they are empty", () => {
  const row = buildReceiptInsert({
    washerId: "washer-1",
    receiptNumber: "1",
    garments: {},
    deliveryDate: "2026-11-24",
  });

  for (const key of ["amount_total", "customer_name", "customer_phone", "tag_number", "services", "drop_off_date"]) {
    assert.ok(Object.prototype.hasOwnProperty.call(row, key), key);
  }
  assert.equal(row.amount_total, 0);
  assert.equal(row.customer_name, null);
  assert.equal(row.customer_phone, null);
  assert.equal(row.tag_number, null);
  assert.deepEqual(row.services, []);
});
