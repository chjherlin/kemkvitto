import assert from "node:assert/strict";
import test from "node:test";
import {
  customerSearchQuery,
  emailLocalStartsWith,
  matchingCustomerEmails,
  normalizeCustomerEmail,
  sameCustomerEmail,
} from "./customer-email.ts";

test("customer emails are trimmed and lower-cased", () => {
  assert.equal(normalizeCustomerEmail("  Anna@Example.com "), "anna@example.com");
  assert.equal(normalizeCustomerEmail("\tANNA@example.com\n"), "anna@example.com");
});

test("the same address is one customer", () => {
  assert.equal(sameCustomerEmail("  Anna@Example.com ", "anna@example.com"), true);
  assert.equal(sameCustomerEmail("anna@example.com", "other@example.com"), false);
  assert.equal(sameCustomerEmail("   ", "anna@example.com"), false);
});

test("search waits for four characters", () => {
  assert.equal(customerSearchQuery("ann"), null);
  assert.equal(customerSearchQuery("  ann "), null);
  assert.equal(customerSearchQuery(" anna "), "anna");
  assert.equal(emailLocalStartsWith("anna@tvatt.se", "ann"), false);
  assert.equal(emailLocalStartsWith("Anna@tvatt.se", "anna"), true);
  assert.equal(emailLocalStartsWith("xanna@tvatt.se", "anna"), false);
});

test("matches are the local part, newest first, and duplicates collapse", () => {
  const hits = matchingCustomerEmails([
    { email: "other@tvatt.se", updatedAt: "2026-11-24T12:00:00Z" },
    { email: "  Anna@Example.com ", updatedAt: "2026-11-20T12:00:00Z" },
    { email: "anna@example.com", updatedAt: "2026-11-23T12:00:00Z" },
    { email: "annabelle@tvatt.se", updatedAt: "2026-11-22T12:00:00Z" },
    { email: "xanna@tvatt.se", updatedAt: "2026-11-24T12:00:00Z" },
  ], "anna");
  assert.deepEqual(hits, ["anna@example.com", "annabelle@tvatt.se"]);
});
