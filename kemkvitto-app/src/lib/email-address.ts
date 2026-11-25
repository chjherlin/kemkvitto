/** Shared address rules for the form and POST /api/receipts. */

const DOMAIN_FIXES: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "icloud.con": "icloud.com",
  "icoud.com": "icloud.com",
};

export function isValidCustomerEmail(value: string | null | undefined): boolean {
  const email = (value ?? "").trim();
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** What POST /api/receipts returns before it writes anything. */
export function receiptEmailRejection(value: string | null | undefined): { status: 400; error: string } | null {
  if (isValidCustomerEmail(value)) return null;
  return { status: 400, error: "Ogiltig e-postadress" };
}

/** A tappable suggestion. Null means we do not guess. */
export function suggestEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const fixed = DOMAIN_FIXES[domain];
  if (!fixed) return null;
  const suggestion = `${local}@${fixed}`;
  return suggestion === email ? null : suggestion;
}

/** The customer row is written only after the receipt mail went out. */
export function shouldSaveCustomer(emailSent: boolean): boolean {
  return emailSent === true;
}

/** "Kvitto skapat" is only for a receipt whose mail was sent. */
export function showCreatedReceipt(emailSent: boolean): boolean {
  return emailSent === true;
}

/** Reminder control on a past receipt. No address means a note, not a button. */
export function reminderControl(email: string | null | undefined, past: boolean): "hidden" | "note" | "button" {
  if (!past) return "hidden";
  if (!isValidCustomerEmail(email)) return "note";
  return "button";
}
