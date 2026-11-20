import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { mailSubject, renderMailHtml, type RenderMailInput } from "./email-template.ts";
import { brandTheme } from "./brand.ts";
import { formatReceiptNumber } from "./receipt-number.ts";

const theme = brandTheme("#82c58a");

function sample(kind: RenderMailInput["kind"], extra: Partial<RenderMailInput> = {}): RenderMailInput {
  return {
    kind,
    locale: "sv",
    businessName: "Ert tvätteri",
    receiptNumber: formatReceiptNumber(42),
    customerName: "Anna <Andersson>",
    customerEmail: "anna@example.com",
    dropOffDate: "2026-11-20",
    readyDate: "2026-11-22",
    lines: [
      { name: "Kavaj", qty: 1, unitPrice: 200 },
      { name: "Byxor", qty: 2, unitPrice: 150 },
    ],
    total: 500,
    showPrices: true,
    theme: {
      brand: theme.brand,
      onBrand: theme.onBrand,
      tint: theme.tint,
      ink: "#1c1917",
      muted: "#797470",
      footer: "rgb(200,200,200)",
      card: "#ffffff",
      plate: "#1c1917",
    },
    logoSrc: "kemkvitto-logo-white.png",
    ...extra,
  };
}

test("subjects use the padded receipt number and the three Swedish lines", () => {
  assert.equal(mailSubject(sample("receipt")), "Kvitto #0042 — Ert tvätteri");
  assert.equal(mailSubject(sample("ready")), "Din kemtvätt borde vara klar idag — Ert tvätteri");
  assert.equal(mailSubject(sample("reminder")), "Påminnelse: Din kemtvätt väntar på dig — Ert tvätteri");
  assert.equal(formatReceiptNumber(42), "0042");
});

test("the header uses the brand colour, not the darker bar", () => {
  const html = renderMailHtml(sample("receipt", { businessName: "A & B <tvätt>" }));
  assert.match(html, new RegExp(`background:${theme.brand}`));
  assert.equal(html.includes(theme.bar), false);
  assert.match(html, /A &amp; B &lt;tvätt&gt;/);
  assert.match(html, /Anna &lt;Andersson&gt;/);
  assert.match(html, /Vi skickar en påminnelse dagen då tvätten borde vara klar/);
  assert.match(html, /Borde vara klar/);
  assert.match(html, /font-size:28px/);
  assert.match(html, /#0042/);
});

test("ready today and the hand reminder use different messages", () => {
  const ready = renderMailHtml(sample("ready"));
  const reminder = renderMailHtml(sample("reminder"));
  assert.match(ready, /Din kemtvätt borde vara klar för hämtning idag/);
  assert.match(ready, /Visa det här kvittot/);
  assert.equal(ready.includes("Påminnelse ·"), false);
  assert.match(reminder, /Påminnelse · Kvitto/);
  assert.match(reminder, /Din kemtvätt väntar på dig/);
  assert.match(reminder, /Tvätten borde vara klar och går att hämta när det passar dig/);
});

test("prices stay off the mail when the laundry has hidden them", () => {
  const html = renderMailHtml(sample("receipt", { showPrices: false }));
  assert.equal(html.includes(">Pris<"), false);
  assert.equal(html.includes(">Totalt<"), false);
  assert.match(html, />Kavaj</);
});

test("a date change keeps the shared layout and says the laundry should be ready", () => {
  const html = renderMailHtml(sample("date", { sooner: true, oldDate: "2026-11-25", readyDate: "2026-11-22" }));
  assert.match(html, /borde vara klar lite tidigare/);
  assert.match(html, /2026-11-25/);
  assert.match(mailSubject(sample("date", { sooner: false })), /ändrat datum — Ert tvätteri/);
});

test("english uses the laundry language", () => {
  assert.match(mailSubject(sample("reminder", { locale: "en" })), /^Reminder:/);
  assert.match(renderMailHtml(sample("receipt", { locale: "en" })), /We send a reminder on the day the laundry should be ready/);
});

test("writes the four review mails", () => {
  const dir = process.env.EMAIL_PREVIEW_DIR
    || join(dirname(fileURLToPath(import.meta.url)), "../../tmp/emails");
  mkdirSync(dir, { recursive: true });
  const logo = join(dirname(fileURLToPath(import.meta.url)), "../../public/kemkvitto-logo-white.png");
  copyFileSync(logo, join(dir, "kemkvitto-logo-white.png"));
  const preview = { customerName: "Anna Andersson" };
  const files: Array<[string, RenderMailInput]> = [
    ["receipt.html", sample("receipt", preview)],
    ["ready.html", sample("ready", preview)],
    ["reminder.html", sample("reminder", preview)],
    ["date-update.html", sample("date", { ...preview, sooner: true, oldDate: "2026-11-25", readyDate: "2026-11-22" })],
  ];
  for (const [name, input] of files) {
    const html = `<!-- Subject: ${mailSubject(input)} -->\n${renderMailHtml(input)}`;
    writeFileSync(join(dir, name), html);
  }
});
