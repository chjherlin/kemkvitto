/** Helpers for the receipt list reminder row. No database access. */

export function utcTodayISO(now = new Date()): string {
  return now.toISOString().split("T")[0];
}

/** The promised day has passed when it is strictly before today (YYYY-MM-DD). */
export function isPromisedDatePast(
  deliveryDate: string | null | undefined,
  today: string
): boolean {
  if (!deliveryDate) return false;
  const day = deliveryDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  return day < today;
}

export function garmentSummary(
  garments: Record<string, number | { qty: number }> | null | undefined,
  nameOf: (name: string) => string
): string {
  if (!garments) return "";
  return Object.entries(garments)
    .map(([name, val]) => {
      const qty = typeof val === "number" ? val : val?.qty ?? 0;
      if (qty <= 0) return "";
      const label = nameOf(name);
      return qty > 1 ? `${label} ×${qty}` : label;
    })
    .filter(Boolean)
    .join(", ");
}

const INTL_LOCALE: Record<string, string> = {
  sv: "sv-SE",
  en: "en-GB",
  da: "da-DK",
  no: "nb-NO",
};

/** Short day and month in the laundry language, for example "19 nov". */
export function formatReminderDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tag = INTL_LOCALE[locale] ?? "sv-SE";
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" })
    .format(date)
    .replace(/\.$/, "");
}
