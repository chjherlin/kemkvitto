/** Email-safe receipt HTML. No local imports, so a plain Node script can render it. */

export type MailLocale = "sv" | "en" | "da" | "no";
export type MailKind = "receipt" | "ready" | "reminder" | "date";

export interface MailTheme {
  brand: string;
  onBrand: string;
  tint: string;
  ink: string;
  muted: string;
  footer: string;
  card: string;
  plate: string;
}

export interface MailLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface RenderMailInput {
  kind: MailKind;
  locale?: string | null;
  businessName: string;
  receiptNumber: string;
  customerName?: string | null;
  customerEmail: string;
  dropOffDate?: string | null;
  readyDate: string;
  oldDate?: string | null;
  sooner?: boolean;
  lines: MailLine[];
  total: number;
  showPrices: boolean;
  comment?: string | null;
  services?: string[] | null;
  theme: MailTheme;
  logoSrc: string;
}

interface Copy {
  receiptWord: string;
  reminderWord: string;
  droppedOff: string;
  shouldBeReady: string;
  receiptMessage: string;
  readyBold: string;
  readyBody: string;
  waitBold: string;
  waitBody: string;
  soonerBold: string;
  laterBold: string;
  newDate: string;
  previousDate: string;
  garment: string;
  qty: string;
  price: string;
  sum: string;
  total: string;
  footer: string;
  services: string;
  comment: string;
  subjectReceipt: (n: string, name: string) => string;
  subjectReady: (name: string) => string;
  subjectReminder: (name: string) => string;
  subjectSooner: (name: string) => string;
  subjectLater: (name: string) => string;
  serviceName: Record<string, string>;
}

const COPY: Record<MailLocale, Copy> = {
  sv: {
    receiptWord: "Kvitto",
    reminderWord: "Påminnelse",
    droppedOff: "Inlämnat",
    shouldBeReady: "Borde vara klar",
    receiptMessage: "Vi skickar en påminnelse dagen då tvätten borde vara klar.",
    readyBold: "Din kemtvätt borde vara klar för hämtning idag.",
    readyBody: "Visa det här kvittot.",
    waitBold: "Din kemtvätt väntar på dig.",
    waitBody: "Tvätten borde vara klar och går att hämta när det passar dig.",
    soonerBold: "Goda nyheter. Din kemtvätt borde vara klar lite tidigare.",
    laterBold: "Uppdatering kring din kemtvätt.",
    newDate: "Nytt datum då den borde vara klar",
    previousDate: "Tidigare datum",
    garment: "Plagg",
    qty: "Ant",
    price: "Pris",
    sum: "Summa",
    total: "Totalt",
    footer: "Kvittot skickas med",
    services: "Tjänster",
    comment: "Kommentar",
    subjectReceipt: (n, name) => `Kvitto #${n} — ${name}`,
    subjectReady: (name) => `Din kemtvätt borde vara klar idag — ${name}`,
    subjectReminder: (name) => `Påminnelse: Din kemtvätt väntar på dig — ${name}`,
    subjectSooner: (name) => `Goda nyheter. Din kemtvätt borde vara klar tidigare — ${name}`,
    subjectLater: (name) => `Uppdatering: ändrat datum — ${name}`,
    serviceName: { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" },
  },
  en: {
    receiptWord: "Receipt",
    reminderWord: "Reminder",
    droppedOff: "Dropped off",
    shouldBeReady: "Should be ready",
    receiptMessage: "We send a reminder on the day the laundry should be ready.",
    readyBold: "Your dry cleaning should be ready for pickup today.",
    readyBody: "Show this receipt.",
    waitBold: "Your dry cleaning is waiting for you.",
    waitBody: "The laundry should be ready and can be picked up when it suits you.",
    soonerBold: "Good news. Your dry cleaning should be ready a little earlier.",
    laterBold: "An update about your dry cleaning.",
    newDate: "New date it should be ready",
    previousDate: "Previous date",
    garment: "Garment",
    qty: "Qty",
    price: "Price",
    sum: "Sum",
    total: "Total",
    footer: "The receipt is sent with",
    services: "Services",
    comment: "Comment",
    subjectReceipt: (n, name) => `Receipt #${n} — ${name}`,
    subjectReady: (name) => `Your dry cleaning should be ready today — ${name}`,
    subjectReminder: (name) => `Reminder: Your dry cleaning is waiting for you — ${name}`,
    subjectSooner: (name) => `Good news. Your dry cleaning should be ready earlier — ${name}`,
    subjectLater: (name) => `Update: the date has changed — ${name}`,
    serviceName: { pressning: "Pressing", starkning: "Starch", vikning: "Folding", express: "Express" },
  },
  da: {
    receiptWord: "Kvittering",
    reminderWord: "Påmindelse",
    droppedOff: "Indleveret",
    shouldBeReady: "Burde være klar",
    receiptMessage: "Vi sender en påmindelse den dag, tøjet burde være klar.",
    readyBold: "Din rens burde være klar til afhentning i dag.",
    readyBody: "Vis denne kvittering.",
    waitBold: "Din rens venter på dig.",
    waitBody: "Tøjet burde være klar og kan hentes, når det passer dig.",
    soonerBold: "Gode nyheder. Din rens burde være klar lidt tidligere.",
    laterBold: "En opdatering om din rens.",
    newDate: "Ny dato hvor den burde være klar",
    previousDate: "Tidligere dato",
    garment: "Tøj",
    qty: "Antal",
    price: "Pris",
    sum: "Sum",
    total: "I alt",
    footer: "Kvitteringen sendes med",
    services: "Tjenester",
    comment: "Kommentar",
    subjectReceipt: (n, name) => `Kvittering #${n} — ${name}`,
    subjectReady: (name) => `Din rens burde være klar i dag — ${name}`,
    subjectReminder: (name) => `Påmindelse: Din rens venter på dig — ${name}`,
    subjectSooner: (name) => `Gode nyheder. Din rens burde være klar tidligere — ${name}`,
    subjectLater: (name) => `Opdatering: datoen er ændret — ${name}`,
    serviceName: { pressning: "Presning", starkning: "Stivelse", vikning: "Foldning", express: "Ekspres" },
  },
  no: {
    receiptWord: "Kvittering",
    reminderWord: "Påminnelse",
    droppedOff: "Innlevert",
    shouldBeReady: "Burde være klar",
    receiptMessage: "Vi sender en påminnelse den dagen tøyet burde være klart.",
    readyBold: "Rensingen din burde være klar for henting i dag.",
    readyBody: "Vis denne kvitteringen.",
    waitBold: "Rensingen din venter på deg.",
    waitBody: "Tøyet burde være klart og kan hentes når det passer deg.",
    soonerBold: "Gode nyheter. Rensingen din burde være klar litt tidligere.",
    laterBold: "En oppdatering om rensingen din.",
    newDate: "Ny dato da den burde være klar",
    previousDate: "Tidligere dato",
    garment: "Plagg",
    qty: "Ant",
    price: "Pris",
    sum: "Sum",
    total: "Totalt",
    footer: "Kvitteringen sendes med",
    services: "Tjenester",
    comment: "Kommentar",
    subjectReceipt: (n, name) => `Kvittering #${n} — ${name}`,
    subjectReady: (name) => `Rensingen din burde være klar i dag — ${name}`,
    subjectReminder: (name) => `Påminnelse: Rensingen din venter på deg — ${name}`,
    subjectSooner: (name) => `Gode nyheter. Rensingen din burde være klar tidligere — ${name}`,
    subjectLater: (name) => `Oppdatering: datoen er endret — ${name}`,
    serviceName: { pressning: "Pressing", starkning: "Stiving", vikning: "Bretting", express: "Ekspress" },
  },
};

export function mailLocale(value: string | null | undefined): MailLocale {
  if (value === "en" || value === "da" || value === "no" || value === "sv") return value;
  return "sv";
}

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MONO = "'JetBrains Mono', 'Courier New', monospace";

function money(amount: number): string {
  return `${amount} kr`;
}

export function mailSubject(input: RenderMailInput): string {
  const copy = COPY[mailLocale(input.locale)];
  const name = input.businessName.trim();
  if (input.kind === "ready") return copy.subjectReady(name);
  if (input.kind === "reminder") return copy.subjectReminder(name);
  if (input.kind === "date") {
    return input.sooner ? copy.subjectSooner(name) : copy.subjectLater(name);
  }
  return copy.subjectReceipt(input.receiptNumber, name);
}

function messageBox(copy: Copy, input: RenderMailInput, ink: string): string {
  if (input.kind === "ready") {
    return `<p style="margin:0;color:${ink};font-size:16px;font-weight:700;">${escapeHtml(copy.readyBold)}</p>
      <p style="margin:8px 0 0;color:${ink};font-size:16px;">${escapeHtml(copy.readyBody)}</p>`;
  }
  if (input.kind === "reminder") {
    return `<p style="margin:0;color:${ink};font-size:16px;font-weight:700;">${escapeHtml(copy.waitBold)}</p>
      <p style="margin:8px 0 0;color:${ink};font-size:16px;">${escapeHtml(copy.waitBody)}</p>`;
  }
  if (input.kind === "date") {
    const bold = input.sooner ? copy.soonerBold : copy.laterBold;
    return `<p style="margin:0;color:${ink};font-size:16px;font-weight:700;">${escapeHtml(bold)}</p>
      <p style="margin:8px 0 0;color:${ink};font-size:16px;">${escapeHtml(copy.newDate)}: ${escapeHtml(input.readyDate)}</p>
      <p style="margin:4px 0 0;color:${ink};font-size:16px;">${escapeHtml(copy.previousDate)}: ${escapeHtml(input.oldDate || "")}</p>`;
  }
  return `<p style="margin:0;color:${ink};font-size:16px;">${escapeHtml(copy.receiptMessage)}</p>`;
}

export function renderMailHtml(input: RenderMailInput): string {
  const copy = COPY[mailLocale(input.locale)];
  const theme = input.theme;
  const number = escapeHtml(input.receiptNumber);
  const heading = input.kind === "reminder"
    ? `${escapeHtml(copy.reminderWord)} · ${escapeHtml(copy.receiptWord)}`
    : escapeHtml(copy.receiptWord);
  const name = (input.customerName || "").trim();
  const serviceLabels = (input.services || [])
    .map((key) => copy.serviceName[key] || key)
    .filter(Boolean);
  const rows = input.lines.map((line) => {
    const lineTotal = line.qty * line.unitPrice;
    const priceCells = input.showPrices
      ? `<td style="padding:8px 0;text-align:right;color:${theme.muted};font-size:16px;font-family:${MONO};font-weight:700;">${escapeHtml(money(line.unitPrice))}</td>
         <td style="padding:8px 0;text-align:right;color:${theme.ink};font-size:16px;font-family:${MONO};font-weight:700;">${escapeHtml(money(lineTotal))}</td>`
      : "";
    return `<tr>
      <td style="padding:8px 0;color:${theme.ink};font-size:16px;">${escapeHtml(line.name)}</td>
      <td style="padding:8px 0;text-align:center;color:${theme.ink};font-size:16px;font-family:${MONO};font-weight:700;">${escapeHtml(String(line.qty))}</td>
      ${priceCells}
    </tr>`;
  }).join("");
  const priceHeads = input.showPrices
    ? `<td style="padding:4px 0 8px;text-align:right;color:${theme.muted};font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(copy.price)}</td>
       <td style="padding:4px 0 8px;text-align:right;color:${theme.muted};font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(copy.sum)}</td>`
    : "";
  const totalRow = input.showPrices
    ? `<tr><td style="padding:16px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${theme.footer};">
          <tr>
            <td style="padding-top:14px;color:${theme.ink};font-size:16px;font-weight:700;">${escapeHtml(copy.total)}</td>
            <td style="padding-top:14px;text-align:right;color:${theme.ink};font-size:30px;font-family:${MONO};font-weight:700;letter-spacing:0.04em;">${escapeHtml(money(input.total))}</td>
          </tr>
        </table>
      </td></tr>`
    : "";
  const services = serviceLabels.length
    ? `<tr><td style="padding:12px 28px 0;color:${theme.muted};font-size:16px;">${escapeHtml(copy.services)}: ${escapeHtml(serviceLabels.join(", "))}</td></tr>`
    : "";
  const comment = (input.comment || "").trim()
    ? `<tr><td style="padding:12px 28px 0;">
        <p style="margin:0;color:${theme.muted};font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(copy.comment)}</p>
        <p style="margin:4px 0 0;color:${theme.ink};font-size:16px;">${escapeHtml(input.comment)}</p>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${theme.footer};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${theme.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.footer};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:${theme.card};border:1px solid ${theme.muted};border-radius:16px;overflow:hidden;">
        <tr><td style="background:${theme.brand};color:${theme.onBrand};padding:28px 24px;text-align:center;">
          <p style="margin:0;color:${theme.onBrand};font-size:22px;font-weight:700;line-height:1.3;">${escapeHtml(input.businessName)}</p>
          <p style="margin:10px 0 0;color:${theme.onBrand};font-size:16px;line-height:1.2;">
            ${heading}
            <span style="font-family:${MONO};font-weight:700;font-size:28px;letter-spacing:0.08em;"> #${number}</span>
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 0;">
          ${name ? `<p style="margin:0;color:${theme.ink};font-size:16px;font-weight:700;">${escapeHtml(name)}</p>` : ""}
          <p style="margin:${name ? "4px" : "0"} 0 0;color:${theme.muted};font-size:16px;">${escapeHtml(input.customerEmail)}</p>
        </td></tr>
        <tr><td style="padding:16px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:${theme.ink};font-size:16px;padding:4px 0;">${escapeHtml(copy.droppedOff)}</td>
              <td style="color:${theme.ink};font-size:19px;font-family:${MONO};font-weight:700;text-align:right;padding:4px 0;">${escapeHtml(input.dropOffDate || "—")}</td>
            </tr>
            <tr>
              <td style="color:${theme.ink};font-size:16px;padding:4px 0;">${escapeHtml(copy.shouldBeReady)}</td>
              <td style="color:${theme.ink};font-size:19px;font-family:${MONO};font-weight:700;text-align:right;padding:4px 0;">${escapeHtml(input.readyDate || "—")}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.tint};border-radius:12px;">
            <tr><td style="padding:16px;">
              ${messageBox(copy, input, theme.ink)}
            </td></tr>
          </table>
        </td></tr>
        ${services}
        <tr><td style="padding:16px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${theme.footer};">
            <tr>
              <td style="padding:12px 0 8px;color:${theme.muted};font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(copy.garment)}</td>
              <td style="padding:12px 0 8px;text-align:center;color:${theme.muted};font-size:16px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(copy.qty)}</td>
              ${priceHeads}
            </tr>
            ${rows}
          </table>
        </td></tr>
        ${totalRow}
        ${comment}
        <tr><td style="padding:24px 0 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.footer};">
            <tr>
              <td style="padding:18px 28px;color:${theme.muted};font-size:16px;">${escapeHtml(copy.footer)}</td>
              <td style="padding:18px 28px;text-align:right;">
                <table role="presentation" cellpadding="0" cellspacing="0" align="right" style="background:${theme.plate};border-radius:8px;">
                  <tr><td style="padding:6px 10px;">
                    <img src="${escapeHtml(input.logoSrc)}" alt="kemkvitto" height="22" style="display:block;height:22px;width:auto;border:0;">
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
