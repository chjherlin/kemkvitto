import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDate,
  formatReminderDate,
  garmentSummary,
  isPromisedDatePast,
  utcTodayISO,
} from "./reminder-list.ts";

test("a promised date has passed only when it is before today", () => {
  assert.equal(isPromisedDatePast("2026-11-19", "2026-11-20"), true);
  assert.equal(isPromisedDatePast("2026-11-20", "2026-11-20"), false);
  assert.equal(isPromisedDatePast("2026-11-21", "2026-11-20"), false);
  assert.equal(isPromisedDatePast("", "2026-11-20"), false);
  assert.equal(isPromisedDatePast(null, "2026-11-20"), false);
});

test("today is a UTC date", () => {
  assert.equal(utcTodayISO(new Date("2026-11-20T23:30:00.000Z")), "2026-11-20");
});

test("Stockholm calendar date is the local day, not UTC", () => {
  assert.equal(calendarDate(new Date("2026-11-20T23:30:00.000Z"), "Europe/Stockholm"), "2026-11-21");
  assert.equal(calendarDate(new Date("2026-11-20T12:00:00.000Z"), "Europe/Stockholm"), "2026-11-20");
});

test("garment summary repeats a quantity only above one", () => {
  const line = garmentSummary(
    { Kavaj: 1, Byxor: { qty: 2 } },
    (name) => name
  );
  assert.equal(line, "Kavaj, Byxor ×2");
});

test("reminder date uses the laundry language", () => {
  const iso = "2026-11-19T12:00:00.000Z";
  assert.match(formatReminderDate(iso, "sv"), /19/);
  assert.match(formatReminderDate(iso, "sv").toLowerCase(), /nov/);
  assert.match(formatReminderDate(iso, "en").toLowerCase(), /nov/);
  assert.equal(formatReminderDate("not-a-date", "sv"), "");
});
