import { Resend } from "resend";
import { generateReceiptPDF } from "./pdf";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || "Kemkvitto <noreply@resend.dev>";

interface Receipt {
  id: string;
  receipt_number: number;
  tag_number?: string | null;
  garments: Record<string, number | { qty: number; bet?: boolean }>;
  delivery_date: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  drop_off_date?: string | null;
  comment: string | null;
  amount_total?: number;
  paid?: boolean;
  services?: string[];
}

interface WasherInfo {
  business_name: string;
  brand_color: string;
  price_list: Record<string, number>;
}

export function getPaymentUrl(receiptId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/pay/${receiptId}`;
}

function parseGarmentLines(
  garments: Record<string, number | { qty: number; bet?: boolean }>,
  priceList: Record<string, number>
): { name: string; qty: number; bet: boolean; unitPrice: number }[] {
  return Object.entries(garments).map(([name, val]) => {
    const qty = typeof val === "number" ? val : val.qty;
    return { name, qty, bet: false, unitPrice: priceList[name] ?? 0 };
  });
}

function calculateTotal(
  lines: { qty: number; unitPrice: number }[],
): number {
  return lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
}

function buildReceiptHTML(
  receipt: Receipt,
  washer: WasherInfo,
  lines: { name: string; qty: number; bet: boolean; unitPrice: number }[],
  total: number,
  paymentUrl: string | null
): string {
  const brandColor = washer.brand_color || "#82C58A";
  const vatAmount = Math.round(total * 0.25 / 1.25);

  const lineRows = lines
    .map((l) => {
      const lineTotal = l.qty * l.unitPrice;
      return `<tr>
        <td style="padding:4px 0;color:#1c1917;font-size:14px;">${l.name}</td>
        <td style="padding:4px 0;text-align:center;color:#78716c;font-size:14px;">${l.qty}</td>
        <td style="padding:4px 0;text-align:right;color:#78716c;font-size:14px;">${l.unitPrice} kr</td>
        <td style="padding:4px 0;text-align:right;color:#1c1917;font-size:14px;font-weight:600;">${lineTotal} kr</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:24px 0;">
    <tr><td align="center">
      <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">

        <!-- Header -->
        <tr><td style="background:${brandColor};padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">${washer.business_name}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Kvitto #${receipt.receipt_number}${receipt.tag_number ? ` — Märke ${receipt.tag_number}` : ""}</p>
        </td></tr>

        <!-- Customer info -->
        <tr><td style="padding:20px 24px 0;">
          ${receipt.customer_name ? `<p style="margin:0 0 4px;color:#1c1917;font-size:15px;font-weight:600;">${receipt.customer_name}</p>` : ""}
          ${receipt.customer_phone ? `<p style="margin:0 0 4px;color:#78716c;font-size:13px;">${receipt.customer_phone}</p>` : ""}
          <p style="margin:0;color:#78716c;font-size:13px;">${receipt.customer_email}</p>
        </td></tr>

        <!-- Dates -->
        <tr><td style="padding:12px 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${receipt.drop_off_date ? `<tr>
              <td style="color:#a8a29e;font-size:12px;padding:2px 0;">Inlämnat</td>
              <td style="color:#78716c;font-size:12px;text-align:right;padding:2px 0;">${receipt.drop_off_date}</td>
            </tr>` : ""}
            <tr>
              <td style="color:#a8a29e;font-size:12px;padding:2px 0;">Färdigt</td>
              <td style="color:#78716c;font-size:12px;text-align:right;padding:2px 0;">${receipt.delivery_date}</td>
            </tr>
          </table>
        </td></tr>

        ${receipt.services && receipt.services.length > 0 ? `
        <tr><td style="padding:8px 24px 0;">
          <p style="margin:0;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Tjänster</p>
          <p style="margin:4px 0 0;color:#78716c;font-size:13px;">${receipt.services.map(s => {
            const names: Record<string, string> = { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" };
            return names[s] || s;
          }).join(", ")}</p>
        </td></tr>` : ""}

        <tr><td style="padding:8px 24px 0;">
          <p style="margin:0;color:${receipt.paid ? '#16a34a' : '#ca8a04'};font-size:12px;font-weight:600;">
            ${receipt.paid ? '\u2713 Betald' : 'Ej betald \u2014 betalas vid hämtning'}
          </p>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:16px 24px 0;">
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:0;">
        </td></tr>

        <!-- Line items -->
        <tr><td style="padding:12px 24px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Plagg</td>
              <td style="padding:4px 0;text-align:center;color:#a8a29e;font-size:11px;text-transform:uppercase;">Ant</td>
              <td style="padding:4px 0;text-align:right;color:#a8a29e;font-size:11px;text-transform:uppercase;">Pris</td>
              <td style="padding:4px 0;text-align:right;color:#a8a29e;font-size:11px;text-transform:uppercase;">Summa</td>
            </tr>
            ${lineRows}
          </table>
        </td></tr>

        <!-- Total -->
        <tr><td style="padding:16px 24px 0;">
          <hr style="border:none;border-top:2px solid #e7e5e4;margin:0 0 12px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#1c1917;font-size:16px;font-weight:700;">TOTALT</td>
              <td style="text-align:right;color:${brandColor};font-size:20px;font-weight:700;font-family:'Courier New',monospace;">${total} kr</td>
            </tr>
            <tr>
              <td colspan="2" style="color:#a8a29e;font-size:11px;padding-top:4px;">varav moms (25%): ${vatAmount} kr</td>
            </tr>
          </table>
        </td></tr>

        ${receipt.comment ? `
        <!-- Comment -->
        <tr><td style="padding:16px 24px 0;">
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:0 0 12px;">
          <p style="margin:0;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Kommentar</p>
          <p style="margin:4px 0 0;color:#78716c;font-size:13px;">${receipt.comment}</p>
        </td></tr>` : ""}

        ${paymentUrl ? `
        <!-- Payment button -->
        <tr><td style="padding:20px 24px 0;">
          <a href="${paymentUrl}" style="display:block;background:${brandColor};color:#ffffff;text-align:center;padding:14px;border-radius:12px;font-size:16px;font-weight:700;text-decoration:none;">
            Betala ${total} kr
          </a>
        </td></tr>` : ""}

        <!-- Footer -->
        <tr><td style="padding:20px 24px 24px;">
          <p style="margin:0;color:#d6d3d1;font-size:12px;text-align:center;">Tack för ditt besök!</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendReceiptEmail(
  receipt: Receipt,
  washer?: WasherInfo
): Promise<void> {
  const priceList = washer?.price_list ?? {};
  const lines = parseGarmentLines(receipt.garments, priceList);
  const total = receipt.amount_total
    ? receipt.amount_total / 100
    : calculateTotal(lines);

  const paymentUrl =
    receipt.amount_total && receipt.amount_total > 0
      ? getPaymentUrl(receipt.id)
      : null;

  const businessName = washer?.business_name ?? "Kemtvätt";
  const brandColor = washer?.brand_color ?? "#82C58A";

  const html = buildReceiptHTML(receipt, {
    business_name: businessName,
    brand_color: brandColor,
    price_list: priceList,
  }, lines, total, paymentUrl);

  // Generate PDF
  const pdfBuffer = generateReceiptPDF({
    receiptNumber: receipt.receipt_number,
    tagNumber: receipt.tag_number ?? null,
    businessName,
    brandColor,
    customerName: receipt.customer_name ?? null,
    customerPhone: receipt.customer_phone ?? null,
    customerEmail: receipt.customer_email,
    dropOffDate: receipt.drop_off_date ?? null,
    deliveryDate: receipt.delivery_date,
    lines,
    betPrice: 0,
    totalAmount: total,
    comment: receipt.comment,
    paymentUrl,
    paid: receipt.paid,
    services: receipt.services,
  });

  if (resend) {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: receipt.customer_email,
      subject: `Kvitto #${receipt.receipt_number} — ${businessName}`,
      html,
      attachments: [
        {
          filename: `kvitto-${receipt.receipt_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    if (result.error) {
      console.error(`Resend error for ${receipt.customer_email}:`, result.error);
      throw new Error(`Resend: ${result.error.message}`);
    }
    console.log(`Email sent to ${receipt.customer_email} for receipt #${receipt.receipt_number}`, result.data);
  } else {
    console.log("=== EMAIL (Resend not configured) ===");
    console.log(`To: ${receipt.customer_email}`);
    console.log(`Subject: Kvitto #${receipt.receipt_number} — ${businessName}`);
    console.log(`Garments: ${lines.map((l) => `${l.name} x${l.qty}`).join(", ")}`);
    console.log(`Total: ${total} kr`);
    if (paymentUrl) console.log(`Payment link: ${paymentUrl}`);
    console.log(`PDF: ${pdfBuffer.length} bytes generated`);
    console.log("=====================================");
  }
}

export async function sendReminderEmail(
  receipt: Receipt,
  washer?: WasherInfo
): Promise<void> {
  const priceList = washer?.price_list ?? {};
  const lines = parseGarmentLines(receipt.garments, priceList);
  const total = receipt.amount_total
    ? receipt.amount_total / 100
    : calculateTotal(lines);

  const businessName = washer?.business_name ?? "Kemtvätt";
  const brandColor = washer?.brand_color ?? "#82C58A";

  const paymentUrl =
    receipt.amount_total && receipt.amount_total > 0
      ? getPaymentUrl(receipt.id)
      : null;

  // Build the full receipt HTML (same as original email)
  const fullHtml = buildReceiptHTML(
    receipt,
    { business_name: businessName, brand_color: brandColor, price_list: priceList },
    lines,
    total,
    paymentUrl
  );

  // Inject reminder banner after the header block
  const reminderBanner = `
        <tr><td style="padding:20px 24px 0;text-align:center;">
          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px;">
            <p style="margin:0;color:#92400e;font-size:16px;font-weight:700;">Idag borde din kemtvätt vara klar!</p>
            <p style="margin:6px 0 0;color:#a16207;font-size:13px;">Här är ditt kvitto:</p>
          </div>
        </td></tr>`;

  // Insert after the header row (before customer info)
  const html = fullHtml.replace(
    '</td></tr>\n\n        <!-- Customer info -->',
    `</td></tr>\n\n        ${reminderBanner}\n\n        <!-- Customer info -->`
  );

  if (resend) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: receipt.customer_email,
      subject: `Påminnelse: Kvitto #${receipt.receipt_number} — ${businessName}`,
      html,
    });
    console.log(`Reminder sent to ${receipt.customer_email} for receipt #${receipt.receipt_number}`);
  } else {
    console.log("=== REMINDER (Resend not configured) ===");
    console.log(`To: ${receipt.customer_email}`);
    console.log(`Receipt #${receipt.receipt_number} — full receipt reminder`);
    console.log("========================================");
  }
}
