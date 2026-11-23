import assert from "node:assert/strict";
import test from "node:test";
import {
  cronRequestAuthorized,
  localClock,
  reminderCandidateDates,
  reminderSchedule,
  shouldSendReadyReminder,
  timezoneForCountry,
} from "./country-timezone.ts";

test("each sold country has a zone, and anything else is Stockholm", () => {
  assert.equal(timezoneForCountry("SE"), "Europe/Stockholm");
  assert.equal(timezoneForCountry("no"), "Europe/Oslo");
  assert.equal(timezoneForCountry("JP"), "Asia/Tokyo");
  assert.equal(timezoneForCountry("US"), "America/New_York");
  assert.equal(timezoneForCountry("IN"), "Asia/Kolkata");
  assert.equal(timezoneForCountry("BR"), "America/Sao_Paulo");
  assert.equal(timezoneForCountry(null), "Europe/Stockholm");
  assert.equal(timezoneForCountry("ZZ"), "Europe/Stockholm");
});

test("local clock follows the zone, including summer time", () => {
  const winter = new Date("2026-11-23T05:00:00.000Z");
  assert.deepEqual(localClock(winter, "Europe/Stockholm"), { date: "2026-11-23", hour: 6 });
  assert.deepEqual(localClock(winter, "Asia/Tokyo"), { date: "2026-11-23", hour: 14 });
  assert.deepEqual(localClock(winter, "America/New_York"), { date: "2026-11-23", hour: 0 });
  const summer = new Date("2026-06-21T04:00:00.000Z");
  assert.deepEqual(localClock(summer, "Europe/Stockholm"), { date: "2026-06-21", hour: 6 });
});

test("a daily call sends for every laundry whose promised date is local today", () => {
  const now = new Date("2026-11-23T05:00:00.000Z");
  assert.equal(shouldSendReadyReminder({
    deliveryDate: "2026-11-23",
    countryCode: "JP",
    now,
    schedule: "daily",
  }), true);
  assert.equal(shouldSendReadyReminder({
    deliveryDate: "2026-11-22",
    countryCode: "SE",
    now,
    schedule: "daily",
  }), false);
  assert.equal(shouldSendReadyReminder({
    deliveryDate: null,
    countryCode: "SE",
    now,
    schedule: "daily",
  }), false);
});

test("an hourly call only sends between 06:00 and 09:00 local time", () => {
  const now = new Date("2026-11-23T05:00:00.000Z");
  assert.equal(shouldSendReadyReminder({
    deliveryDate: "2026-11-23",
    countryCode: "SE",
    now,
    schedule: "hourly",
  }), true);
  assert.equal(shouldSendReadyReminder({
    deliveryDate: "2026-11-23",
    countryCode: "JP",
    now,
    schedule: "hourly",
  }), false);
  const nine = new Date("2026-11-23T08:00:00.000Z");
  assert.equal(localClock(nine, "Europe/Stockholm").hour, 9);
  assert.equal(shouldSendReadyReminder({
    deliveryDate: "2026-11-23",
    countryCode: "SE",
    now: nine,
    schedule: "hourly",
  }), false);
});

test("the schedule is daily unless the call asks for hourly", () => {
  assert.equal(reminderSchedule("https://kemkvitto.se/api/cron/reminders"), "daily");
  assert.equal(reminderSchedule("https://kemkvitto.se/api/cron/reminders?mode=hourly"), "hourly");
  assert.equal(reminderSchedule("https://kemkvitto.se/api/cron/reminders?mode=daily"), "daily");
});

test("a missing secret never authorizes, and both headers do when it is set", () => {
  assert.equal(cronRequestAuthorized({
    configuredSecret: undefined,
    authorization: "Bearer anything",
    legacyHeader: "anything",
  }), false);
  assert.equal(cronRequestAuthorized({
    configuredSecret: "",
    authorization: "Bearer ",
    legacyHeader: "",
  }), false);
  assert.equal(cronRequestAuthorized({
    configuredSecret: "placeholder",
    authorization: "Bearer placeholder",
    legacyHeader: null,
  }), true);
  assert.equal(cronRequestAuthorized({
    configuredSecret: "placeholder",
    authorization: null,
    legacyHeader: "placeholder",
  }), true);
  assert.equal(cronRequestAuthorized({
    configuredSecret: "placeholder",
    authorization: "Bearer wrong",
    legacyHeader: "wrong",
  }), false);
});

test("candidate dates cover the UTC day and its neighbours", () => {
  assert.deepEqual(
    reminderCandidateDates(new Date("2026-11-23T05:00:00.000Z")),
    ["2026-11-22", "2026-11-23", "2026-11-24"]
  );
});
