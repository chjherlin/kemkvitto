import { Resend } from "resend";
import { formatLaundryMoney, garmentUnitPrice, isUnpricedGarment } from "./laundry-defaults";
import { pricesEnabled } from "./prices";
import { formatReceiptNumber } from "./receipt-number";
import { DEFAULT_BRAND, INK_DARK, INK_LIGHT, PALETTE, brandTheme, tint } from "./brand";
import {
  MAIL_LOGO_URL,
  mailSubject,
  renderMailHtml,
  type MailKind,
  type MailLine,
  type RenderMailInput,
} from "./email-template";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || "Kemkvitto <noreply@resend.dev>";

interface Receipt {
  id: string;
  receipt_number: number | string;
  tag_number?: string | null;
  garments: Record<string, number | { qty: number; bet?: boolean }>;
  delivery_date: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  drop_off_date?: string | null;
  comment: string | null;
  amount_total?: number;
  services?: string[];
}

export interface WasherInfo {
  business_name: string;
  brand_color: string;
  price_list: Record<string, number>;
  locale?: string | null;
  country_code?: string | null;
}

function parseGarmentLines(
  garments: Record<string, number | { qty: number; bet?: boolean }>,
  priceList: Record<string, number>
): MailLine[] {
  return Object.entries(garments || {}).map(([name, val]) => {
    const qty = typeof val === "number" ? val : val.qty;
    return {
      name,
      qty,
      unitPrice: garmentUnitPrice(name, priceList),
      hidePrice: isUnpricedGarment(name),
    };
  });
}

function calculateTotal(lines: MailLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

/** Public production file. Preview deploys protect NEXTAUTH_URL, so the mail cannot load the logo from there. */
export function mailLogoUrl(): string {
  return MAIL_LOGO_URL;
}

function mailTheme(brandColor: string): RenderMailInput["theme"] {
  const theme = brandTheme(brandColor || DEFAULT_BRAND);
  const grey = PALETTE.find((color) => color.id === "grey")!.hex;
  return {
    brand: theme.brand,
    onBrand: theme.onBrand,
    tint: theme.tint,
    ink: INK_DARK,
    muted: brandTheme(grey).bar,
    footer: tint(grey),
    card: INK_LIGHT,
  };
}

function render(
  kind: MailKind,
  receipt: Receipt,
  washer: WasherInfo | undefined,
  extra?: { oldDate?: string; sooner?: boolean }
): { subject: string; html: string } {
  const priceList = washer?.price_list ?? {};
  const showPrices = pricesEnabled(priceList);
  const lines = parseGarmentLines(receipt.garments, priceList);
  const total = receipt.amount_total
    ? receipt.amount_total / 100
    : calculateTotal(lines);
  const input: RenderMailInput = {
    kind,
    locale: washer?.locale,
    businessName: washer?.business_name?.trim() || "",
    receiptNumber: formatReceiptNumber(receipt.receipt_number),
    customerName: receipt.customer_name,
    customerEmail: receipt.customer_email,
    dropOffDate: receipt.drop_off_date,
    readyDate: receipt.delivery_date,
    oldDate: extra?.oldDate,
    sooner: extra?.sooner,
    lines,
    total,
    showPrices,
    comment: receipt.comment,
    services: receipt.services,
    theme: mailTheme(washer?.brand_color || DEFAULT_BRAND),
    logoSrc: mailLogoUrl(),
    formatMoney: (amount) => formatLaundryMoney(amount, washer?.country_code),
  };
  return { subject: mailSubject(input), html: renderMailHtml(input) };
}

async function deliver(to: string, subject: string, html: string, log: string): Promise<void> {
  if (resend) {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error(`Resend error for ${to}:`, result.error);
      throw new Error(`Resend: ${result.error.message}`);
    }
    console.log(log, result.data);
    return;
  }
  console.log(`=== EMAIL (Resend not configured) ===\nTo: ${to}\nSubject: ${subject}\n${log}\n====================================`);
}

export async function sendReceiptEmail(receipt: Receipt, washer?: WasherInfo): Promise<void> {
  const { subject, html } = render("receipt", receipt, washer);
  await deliver(
    receipt.customer_email,
    subject,
    html,
    `Receipt #${formatReceiptNumber(receipt.receipt_number)}`
  );
}

/** Hand-sent from the receipt list, after the promised date. */
export async function sendReminderEmail(receipt: Receipt, washer?: WasherInfo): Promise<void> {
  const { subject, html } = render("reminder", receipt, washer);
  await deliver(
    receipt.customer_email,
    subject,
    html,
    `Reminder #${formatReceiptNumber(receipt.receipt_number)}`
  );
}

/** Automatic mail on the promised date itself. */
export async function sendReadyTodayEmail(receipt: Receipt, washer?: WasherInfo): Promise<void> {
  const { subject, html } = render("ready", receipt, washer);
  await deliver(
    receipt.customer_email,
    subject,
    html,
    `Ready today #${formatReceiptNumber(receipt.receipt_number)}`
  );
}

export async function sendDateUpdateEmail(
  receipt: Receipt,
  oldDate: string,
  newDate: string,
  washer?: WasherInfo
): Promise<void> {
  const updated = { ...receipt, delivery_date: newDate };
  const { subject, html } = render("date", updated, washer, {
    oldDate,
    sooner: newDate < oldDate,
  });
  await deliver(
    receipt.customer_email,
    subject,
    html,
    `Date update #${formatReceiptNumber(receipt.receipt_number)} ${oldDate} -> ${newDate}`
  );
}
