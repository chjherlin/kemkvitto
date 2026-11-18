import { Resend } from "resend";
import type { SubscriptionLocale } from "./pricing";
import { formatEur } from "./pricing";

const REVERSE_CHARGE: Record<SubscriptionLocale, string> = {
  sv: "Omvänd skattskyldighet: Kemkvitto (AP&E Ltd, Gibraltar) tar inte ut moms. Köparen är ett företag och redovisar eventuell moms själv.",
  en: "Reverse charge: Kemkvitto (AP&E Ltd, Gibraltar) does not charge VAT. The customer is a business and accounts for any VAT.",
  da: "Omvendt betalingspligt: Kemkvitto (AP&E Ltd, Gibraltar) opkræver ikke moms. Kunden er en virksomhed og står selv for eventuel moms.",
  no: "Omvendt avgiftsplikt: Kemkvitto (AP&E Ltd, Gibraltar) krever ikke merverdiavgift. Kunden er en bedrift og står selv for eventuell mva.",
};

const PRICE_NOTICE: Record<
  SubscriptionLocale,
  (input: { business: string; from: string; to: string; date: string }) => { subject: string; text: string }
> = {
  sv: ({ business, from, to, date }) => ({
    subject: `Prisändring för ${business}`,
    text: `Priset för Kemkvitto ändras från ${from} till ${to}. Det nya priset börjar gälla ${date}, minst 30 dagar efter det här meddelandet.`,
  }),
  en: ({ business, from, to, date }) => ({
    subject: `Price change for ${business}`,
    text: `The Kemkvitto price changes from ${from} to ${to}. The new price starts on ${date}, at least 30 days after this notice.`,
  }),
  da: ({ business, from, to, date }) => ({
    subject: `Prisændring for ${business}`,
    text: `Prisen for Kemkvitto ændres fra ${from} til ${to}. Den nye pris gælder fra ${date}, mindst 30 dage efter denne besked.`,
  }),
  no: ({ business, from, to, date }) => ({
    subject: `Prisendring for ${business}`,
    text: `Prisen for Kemkvitto endres fra ${from} til ${to}. Den nye prisen gjelder fra ${date}, minst 30 dager etter denne meldingen.`,
  }),
};

export function normalizeLocale(value: string | null | undefined): SubscriptionLocale {
  if (value === "en" || value === "da" || value === "no" || value === "sv") return value;
  return "sv";
}

export function reverseChargeNote(locale: SubscriptionLocale): string {
  return REVERSE_CHARGE[locale];
}

export async function sendPriceChangeNotice(input: {
  to: string;
  locale: string | null;
  businessName: string;
  fromEur: number;
  toEur: number;
  effectiveAt: Date;
}): Promise<void> {
  const locale = normalizeLocale(input.locale);
  const date = input.effectiveAt.toISOString().slice(0, 10);
  const copy = PRICE_NOTICE[locale]({
    business: input.businessName,
    from: formatEur(input.fromEur),
    to: formatEur(input.toEur),
    date,
  });
  const from = process.env.EMAIL_FROM || "Kemkvitto <noreply@resend.dev>";
  if (!process.env.RESEND_API_KEY) {
    console.log(`Price notice skipped (no RESEND_API_KEY) washer=${input.businessName} ${date}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: copy.subject,
    text: copy.text,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
}
