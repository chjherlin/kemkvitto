import assert from "node:assert/strict";
import test from "node:test";
import { compareReceiptNumbersDesc, formatReceiptNumber, parseReceiptCounter } from "./receipt-number.ts";

test("pure integers are padded to at least four digits", () => {
  assert.equal(formatReceiptNumber(1), "0001");
  assert.equal(formatReceiptNumber(23), "0023");
  assert.equal(formatReceiptNumber(579), "0579");
  assert.equal(formatReceiptNumber(9999), "9999");
  assert.equal(formatReceiptNumber(10000), "10000");
  assert.equal(formatReceiptNumber("23"), "0023");
  assert.equal(formatReceiptNumber("0001"), "0001");
});

test("odd receipt numbers are not padded", () => {
  assert.equal(formatReceiptNumber("33-1-3"), "33-1-3");
  assert.equal(formatReceiptNumber("A-42"), "A-42");
});

test("receipt list sorts numbers numerically and puts odd values last", () => {
  const input = ["0001", "33-1-3", "10", "A-42", "0002", "10000"];
  const sorted = [...input].sort(compareReceiptNumbersDesc);
  assert.deepEqual(sorted, ["10000", "10", "0002", "0001", "33-1-3", "A-42"]);
});

test("the counter parser keeps the integer and ignores padding", () => {
  assert.equal(parseReceiptCounter("0001"), 1);
  assert.equal(parseReceiptCounter("0023"), 23);
  assert.equal(parseReceiptCounter("10000"), 10000);
  assert.equal(parseReceiptCounter(""), 1);
});
