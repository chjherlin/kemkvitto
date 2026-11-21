/**
 * Laundry customer prices. Not the Kemkvitto subscription (that stays in pricing.ts).
 *
 * One Swedish list is the only set of amounts. Every other country is that list
 * times a factor, rounded, with the two shirt packages reset from the rounded
 * shirt (×150/80 and ×250/80) so the package ratio survives the rounding.
 * Change a Swedish price, a factor, or a rounding step here and nowhere else.
 *
 * Factors, all approximations, none of them a live rate:
 * - Sweden: ×1, step 1. The list is already the amounts we want.
 * - Norway: ×1.10, nearest 5. Denmark: ×0.70, nearest 5. These are the factors
 *   already used for those countries, not a market cross.
 * - Euro (FI, DE, FR, ES, PT, IT, NL): ÷11.5, nearest 0.50. This is the factor
 *   Finland already uses. ECB printed 11.2125 SEK per EUR on 20 November 2026;
 *   that print is not used for the euro, so a Finnish laundry stays as it is.
 * - GBP, USD, JPY, MXN, BRL, PLN, TRY, INR: ECB reference rates of 20 November
 *   2026, units of currency per 1 EUR, crossed through that day's 11.2125 SEK
 *   per EUR. Source: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
 *   local = Swedish kronor × (units per EUR) / 11.2125, then round.
 *   Nearest 0.50: GBP, USD, BRL, PLN. Nearest 1: JPY, MXN, TRY, INR.
 *
 * Shown text is an explicit table, not Intl, so Sweden and Finland stay
 * byte-for-byte as they are today:
 * - SEK, NOK, DKK: "80 kr". A fraction uses two digits and a comma: "7,50 kr".
 * - EUR: "7 €" and "7,50 €". The symbol follows the amount, with a space.
 *   Every euro country uses this, including Germany and Spain.
 * - GBP: "£6.00". USD: "$8.00". MXN: "MX$150.00" (not a bare $, which is USD).
 *   The symbol leads, there is no space, and two digits always show.
 * - BRL: "R$ 46,50". The symbol leads, with a space, and a comma.
 * - PLN: "32,00 zł". The symbol follows, with a space, and a comma.
 * - JPY: "¥1244". TRY: "₺397". INR: "₹727". The symbol leads, no space,
 *   no decimals, no thousands separator. A fractional stored amount is
 *   rounded half up to a whole unit only when it is shown.
 * A missing or unknown country uses the Swedish list and "kr".
 */

export type LaundryCurrency =
  | "SEK"
  | "NOK"
  | "DKK"
  | "EUR"
  | "GBP"
  | "USD"
  | "JPY"
  | "MXN"
  | "BRL"
  | "PLN"
  | "TRY"
  | "INR";

export const LAUNDRY_COUNTRIES = [
  "SE", "NO", "DK", "FI", "DE", "FR", "ES", "PT", "IT",
  "GB", "US", "JP", "MX", "BR", "PL", "NL", "TR", "IN",
] as const;

/** ECB euro reference rates, 20 November 2026. Units of currency per 1 euro. */
export const ECB_REFERENCE = {
  date: "2026-11-20",
  sekPerEur: 11.2125,
  unitsPerEur: {
    GBP: 0.83735,
    USD: 1.099,
    JPY: 174.35,
    MXN: 20.9547,
    BRL: 6.5259,
    PLN: 4.4583,
    TRY: 55.5788,
    INR: 101.85,
  },
} as const;

const SWEDISH_PRICES: Record<string, number> = {
  "Rock": 250, "Kostym": 350, "Kavaj": 200, "Byxor": 150, "Kappa": 350,
  "Dräkt": 300, "Jacka": 250, "Kjol": 150, "Poplin": 100, "Matta": 400,
  "Klänning": 250, "Blus": 130, "Skjorta": 80, "5 Skjortor": 150, "10 Skjortor": 250,
  "Mocka": 500, "Slips": 80, "Jumper": 130, "Gardin": 200, "Vittvätt": 100,
  "Pressning": 50, "Stärkning": 30, "Vikning": 20, "Express": 100,
};

const SHIRT = "Skjorta";
const PACK_5 = "5 Skjortor";
const PACK_10 = "10 Skjortor";

type MoneyFormat = {
  symbol: string;
  position: "before" | "after";
  space: boolean;
  decimal: "." | ",";
  /** "auto" hides decimals on a whole number and otherwise shows two. */
  fraction: 0 | 2 | "auto";
};

const FORMATS: Record<LaundryCurrency, MoneyFormat> = {
  SEK: { symbol: "kr", position: "after", space: true, decimal: ",", fraction: "auto" },
  NOK: { symbol: "kr", position: "after", space: true, decimal: ",", fraction: "auto" },
  DKK: { symbol: "kr", position: "after", space: true, decimal: ",", fraction: "auto" },
  EUR: { symbol: "€", position: "after", space: true, decimal: ",", fraction: "auto" },
  GBP: { symbol: "£", position: "before", space: false, decimal: ".", fraction: 2 },
  USD: { symbol: "$", position: "before", space: false, decimal: ".", fraction: 2 },
  JPY: { symbol: "¥", position: "before", space: false, decimal: ".", fraction: 0 },
  MXN: { symbol: "MX$", position: "before", space: false, decimal: ".", fraction: 2 },
  BRL: { symbol: "R$", position: "before", space: true, decimal: ",", fraction: 2 },
  PLN: { symbol: "zł", position: "after", space: true, decimal: ",", fraction: 2 },
  TRY: { symbol: "₺", position: "before", space: false, decimal: ",", fraction: 0 },
  INR: { symbol: "₹", position: "before", space: false, decimal: ".", fraction: 0 },
};

export type LaundryPriceRule = {
  currency: LaundryCurrency;
  /** Swedish kronor times this number, before rounding. */
  perSek: number;
  step: number;
  /** Short description of the factor. For people, not parsed. */
  factor: string;
};

const EURO_PER_SEK = 1 / 11.5;

function ecbPerSek(unitsPerEur: number): number {
  return unitsPerEur / ECB_REFERENCE.sekPerEur;
}

const RULES: Record<string, LaundryPriceRule> = {
  SE: { currency: "SEK", perSek: 1, step: 1, factor: "×1, avrundning 1" },
  NO: { currency: "NOK", perSek: 1.1, step: 5, factor: "×1,10, närmaste 5" },
  DK: { currency: "DKK", perSek: 0.7, step: 5, factor: "×0,70, närmaste 5" },
  FI: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  DE: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  FR: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  ES: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  PT: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  IT: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  NL: { currency: "EUR", perSek: EURO_PER_SEK, step: 0.5, factor: "÷11,5, närmaste 0,50" },
  GB: { currency: "GBP", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.GBP), step: 0.5, factor: "ECB 2026-11-20, 0,83735 GBP/EUR via 11,2125 SEK/EUR, närmaste 0,50" },
  US: { currency: "USD", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.USD), step: 0.5, factor: "ECB 2026-11-20, 1,0990 USD/EUR via 11,2125 SEK/EUR, närmaste 0,50" },
  JP: { currency: "JPY", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.JPY), step: 1, factor: "ECB 2026-11-20, 174,35 JPY/EUR via 11,2125 SEK/EUR, närmaste 1" },
  MX: { currency: "MXN", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.MXN), step: 1, factor: "ECB 2026-11-20, 20,9547 MXN/EUR via 11,2125 SEK/EUR, närmaste 1" },
  BR: { currency: "BRL", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.BRL), step: 0.5, factor: "ECB 2026-11-20, 6,5259 BRL/EUR via 11,2125 SEK/EUR, närmaste 0,50" },
  PL: { currency: "PLN", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.PLN), step: 0.5, factor: "ECB 2026-11-20, 4,4583 PLN/EUR via 11,2125 SEK/EUR, närmaste 0,50" },
  TR: { currency: "TRY", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.TRY), step: 1, factor: "ECB 2026-11-20, 55,5788 TRY/EUR via 11,2125 SEK/EUR, närmaste 1" },
  IN: { currency: "INR", perSek: ecbPerSek(ECB_REFERENCE.unitsPerEur.INR), step: 1, factor: "ECB 2026-11-20, 101,8500 INR/EUR via 11,2125 SEK/EUR, närmaste 1" },
};

function roundHalfUp(value: number, step: number): number {
  const units = value / step;
  const sign = units < 0 ? -1 : 1;
  const roundedUnits = Math.floor(Math.abs(units) + 0.5) * sign;
  const decimals = (step.toString().split(".")[1] || "").length;
  return Number((roundedUnits * step).toFixed(decimals));
}

function derive(rule: LaundryPriceRule): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const [name, sek] of Object.entries(SWEDISH_PRICES)) {
    prices[name] = roundHalfUp(sek * rule.perSek, rule.step);
  }
  const shirt = prices[SHIRT];
  const ratio5 = SWEDISH_PRICES[PACK_5] / SWEDISH_PRICES[SHIRT];
  const ratio10 = SWEDISH_PRICES[PACK_10] / SWEDISH_PRICES[SHIRT];
  prices[PACK_5] = roundHalfUp(shirt * ratio5, rule.step);
  prices[PACK_10] = roundHalfUp(shirt * ratio10, rule.step);
  return prices;
}

export function laundryPriceRule(countryCode: string | null | undefined): LaundryPriceRule {
  if (!countryCode) return RULES.SE;
  return RULES[countryCode.toUpperCase()] ?? RULES.SE;
}

export function laundryCurrency(countryCode: string | null | undefined): LaundryCurrency {
  return laundryPriceRule(countryCode).currency;
}

export function currencyAffix(countryCode: string | null | undefined): {
  symbol: string;
  position: "before" | "after";
} {
  const format = FORMATS[laundryCurrency(countryCode)];
  return { symbol: format.symbol, position: format.position };
}

export function currencySymbol(countryCode: string | null | undefined): string {
  return currencyAffix(countryCode).symbol;
}

/** Shown price. See the file header for the per-currency pattern. */
export function formatLaundryMoney(amount: number, countryCode: string | null | undefined): string {
  const format = FORMATS[laundryCurrency(countryCode)];
  const digits = format.fraction === "auto"
    ? (Number.isInteger(amount) ? 0 : 2)
    : format.fraction;
  const rounded = digits === 0 ? roundHalfUp(amount, 1) : amount;
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const text = digits === 0
    ? String(Math.trunc(abs + 1e-9))
    : abs.toFixed(2).replace(".", format.decimal);
  const body = negative ? `-${text}` : text;
  if (format.position === "before") {
    return format.space ? `${format.symbol} ${body}` : `${format.symbol}${body}`;
  }
  return format.space ? `${body} ${format.symbol}` : `${body}${format.symbol}`;
}

export const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta", "5 Skjortor", "10 Skjortor",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];

export const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];

export function examplePrices(countryCode: string | null | undefined): Record<string, number> {
  return { ...derive(laundryPriceRule(countryCode)) };
}

/** Swedish seed. Kept so older imports still mean "today's Swedish list". */
export const DEFAULT_PRICE_LIST = examplePrices("SE");

const HIDDEN_GARMENTS = new Set(["Skjorta ×5", "Skjorta ×10"]);

export function visibleGarments(list: string[] | null | undefined): string[] {
  const source = list ?? DEFAULT_GARMENTS;
  return source.filter((name) => !HIDDEN_GARMENTS.has(name));
}
