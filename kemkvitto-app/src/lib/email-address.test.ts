import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidCustomerEmail,
  receiptEmailRejection,
  reminderControl,
  shouldSaveCustomer,
  showCreatedReceipt,
  suggestEmail,
} from "./email-address.ts";

test("the client and the server reject an empty or malformed address with 400", () => {
  for (const value of ["", "   ", "kim", "kim@", "kim@gmail", "kim @gmail.com"]) {
    assert.equal(isValidCustomerEmail(value), false);
    assert.deepEqual(receiptEmailRejection(value), { status: 400, error: "Ogiltig e-postadress" });
  }
  assert.equal(isValidCustomerEmail("kim@gmail.com"), true);
  assert.equal(receiptEmailRejection("  Kim@Gmail.com  "), null);
});

test("common domain typos suggest a correction and do not replace the address", () => {
  assert.equal(suggestEmail("kim@gmial.com"), "kim@gmail.com");
  assert.equal(suggestEmail("kim@gmai.com"), "kim@gmail.com");
  assert.equal(suggestEmail("kim@hotmial.com"), "kim@hotmail.com");
  assert.equal(suggestEmail("kim@hotmail.con"), "kim@hotmail.com");
  assert.equal(suggestEmail("kim@outlook.con"), "kim@outlook.com");
  assert.equal(suggestEmail("kim@yaho.com"), "kim@yahoo.com");
  assert.equal(suggestEmail("kim@icloud.con"), "kim@icloud.com");
  assert.equal(suggestEmail("kim@gmail.com"), null);
  assert.equal(suggestEmail("kim@example.com"), null);
  assert.equal(isValidCustomerEmail("kim@gmial.com"), true);
});

test("the customer row is saved only after the mail send succeeds", () => {
  assert.equal(shouldSaveCustomer(false), false);
  assert.equal(shouldSaveCustomer(true), true);
  assert.equal(showCreatedReceipt(false), false);
  assert.equal(showCreatedReceipt(true), true);
});

test("a receipt without an email has no reminder button", () => {
  assert.equal(reminderControl("", true), "note");
  assert.equal(reminderControl("   ", true), "note");
  assert.equal(reminderControl("inte-en-adress", true), "note");
  assert.equal(reminderControl("kim@example.com", true), "button");
  assert.equal(reminderControl("kim@example.com", false), "hidden");
  assert.equal(reminderControl("", false), "hidden");
});
