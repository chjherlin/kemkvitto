/**
 * One timezone per sold country. Countries with several zones use the zone
 * of the largest city. Anything unknown stays on Europe/Stockholm.
 */
const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  FI: "Europe/Helsinki",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  IT: "Europe/Rome",
  GB: "Europe/London",
  US: "America/New_York",
  JP: "Asia/Tokyo",
  MX: "America/Mexico_City",
  BR: "America/Sao_Paulo",
  PL: "Europe/Warsaw",
  NL: "Europe/Amsterdam",
  TR: "Europe/Istanbul",
  IN: "Asia/Kolkata",
};

export function timezoneForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return "Europe/Stockholm";
  return TIMEZONE_BY_COUNTRY[countryCode.toUpperCase()] ?? "Europe/Stockholm";
}

export interface LocalClock {
  date: string;
  hour: number;
}

/** Calendar date and hour in a timezone. The date is YYYY-MM-DD. */
export function localClock(now: Date, timeZone: string): LocalClock {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const hourText = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return { date, hour: Number(hourText) };
}

export type ReminderSchedule = "daily" | "hourly";

/**
 * The deployed job runs once a day and has no mode flag, so every laundry
 * whose promised date is its own local today is included.
 * A later hourly call passes mode=hourly and then only sends while the
 * laundry's local time is 06:00 up to, but not including, 09:00.
 */
export function reminderSchedule(url: string): ReminderSchedule {
  const mode = new URL(url).searchParams.get("mode");
  return mode === "hourly" ? "hourly" : "daily";
}

export function shouldSendReadyReminder(input: {
  deliveryDate: string | null | undefined;
  countryCode: string | null | undefined;
  now: Date;
  schedule: ReminderSchedule;
}): boolean {
  if (!input.deliveryDate) return false;
  const clock = localClock(input.now, timezoneForCountry(input.countryCode));
  if (input.deliveryDate.slice(0, 10) !== clock.date) return false;
  if (input.schedule === "hourly" && (clock.hour < 6 || clock.hour >= 9)) return false;
  return true;
}

/** True only when a configured secret matches Bearer or the older header. */
export function cronRequestAuthorized(input: {
  configuredSecret: string | undefined;
  authorization: string | null;
  legacyHeader: string | null;
}): boolean {
  const secret = input.configuredSecret;
  if (!secret) return false;
  if (input.authorization === `Bearer ${secret}`) return true;
  return input.legacyHeader === secret;
}

/** UTC dates that can still be "today" in some laundry timezone. */
export function reminderCandidateDates(now: Date): string[] {
  return [-1, 0, 1].map((shift) => {
    const instant = new Date(now.getTime() + shift * 24 * 60 * 60 * 1000);
    return instant.toISOString().slice(0, 10);
  });
}
