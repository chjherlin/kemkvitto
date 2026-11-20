/**
 * Pad a pure integer to at least four digits. Longer numbers are kept in full.
 * Anything that is not a pure integer, such as "33-1-3", is returned unchanged.
 */
export function formatReceiptNumber(n: number | string | null | undefined): string {
  if (n == null) return "";
  if (typeof n === "number") {
    if (!Number.isFinite(n)) return String(n);
    return String(Math.trunc(Math.abs(n))).padStart(4, "0");
  }
  const trimmed = n.trim();
  if (!/^\d+$/.test(trimmed)) return n;
  return trimmed.padStart(4, "0");
}

export function parseReceiptCounter(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 1;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.trunc(n), 2147483647);
}

function sortKey(value: string | number | null | undefined): { numeric: boolean; value: number; raw: string } {
  const raw = value == null ? "" : String(value).trim();
  if (/^\d+$/.test(raw)) return { numeric: true, value: Number(raw), raw };
  return { numeric: false, value: Number.POSITIVE_INFINITY, raw };
}

/** Numeric values descending. Non-numeric numbers sort after every numeric value. */
export function compareReceiptNumbersDesc(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka.numeric !== kb.numeric) return ka.numeric ? -1 : 1;
  if (ka.numeric && ka.value !== kb.value) return kb.value - ka.value;
  return ka.raw.localeCompare(kb.raw, "sv");
}
