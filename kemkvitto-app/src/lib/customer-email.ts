/** Customer identity is the email address, compared after trim and lower case. */

export function normalizeCustomerEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Search stays quiet until four characters. The query itself is trimmed and lower-cased. */
export function customerSearchQuery(raw: string | null | undefined): string | null {
  const query = (raw ?? "").trim().toLowerCase();
  return query.length >= 4 ? query : null;
}

/** True when the part before @ starts with the query. */
export function emailLocalStartsWith(email: string, rawQuery: string): boolean {
  const query = customerSearchQuery(rawQuery);
  if (!query) return false;
  const local = normalizeCustomerEmail(email).split("@")[0] ?? "";
  return local.startsWith(query);
}

export function sameCustomerEmail(a: string, b: string): boolean {
  const left = normalizeCustomerEmail(a);
  return left.length > 0 && left === normalizeCustomerEmail(b);
}

export function matchingCustomerEmails(
  rows: { email: string; updatedAt?: string | null }[],
  rawQuery: string,
  limit = 5
): string[] {
  const query = customerSearchQuery(rawQuery);
  if (!query) return [];
  const seen = new Set<string>();
  return rows
    .filter((row) => emailLocalStartsWith(row.email, query))
    .slice()
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .map((row) => normalizeCustomerEmail(row.email))
    .filter((email) => {
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    })
    .slice(0, limit);
}
