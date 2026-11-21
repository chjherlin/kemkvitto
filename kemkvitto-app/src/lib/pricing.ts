/**
 * Single source for Kemkvitto subscription prices.
 * Formula matches the Kalkyl sheet (rows 59–86):
 * price = MIN(ceiling, MAX(floor, ROUND(raw/step)*step))
 * raw = basePrice * (countryGdp / referenceGdp) ^ sensitivity
 * Excel ROUND is half away from zero (half up for positive amounts).
 * Sweden is the reference country and equals basePrice.
 * Yearly charge = 12 * monthly * (1 - yearlyDiscount).
 */

export type SubscriptionLocale = "sv" | "en" | "da" | "no";
export type BillingInterval = "month" | "year";

export const pricingConfig = {
  basePriceEur: 6.5,
  sensitivity: 0.5,
  floorEur: 3,
  ceilingEur: 25,
  stepEur: 0.5,
  yearlyDiscount: 0.2,
  referenceCountryCode: "SE",
  currency: "eur" as const,
  trialDays: 30,
  priceChangeNoticeDays: 30,
};

export interface CountryPriceRow {
  code: string;
  gdpPppThousands: number;
  name: Record<SubscriptionLocale, string>;
}

export const countries: CountryPriceRow[] = [
  { code: "SE", gdpPppThousands: 74.65, name: { sv: "Sverige", en: "Sweden", da: "Sverige", no: "Sverige" } },
  { code: "NO", gdpPppThousands: 111.46, name: { sv: "Norge", en: "Norway", da: "Norge", no: "Norge" } },
  { code: "DK", gdpPppThousands: 87.3, name: { sv: "Danmark", en: "Denmark", da: "Danmark", no: "Danmark" } },
  { code: "FI", gdpPppThousands: 67.1, name: { sv: "Finland", en: "Finland", da: "Finland", no: "Finland" } },
  { code: "DE", gdpPppThousands: 74.9, name: { sv: "Tyskland", en: "Germany", da: "Tyskland", no: "Tyskland" } },
  { code: "FR", gdpPppThousands: 66.56, name: { sv: "Frankrike", en: "France", da: "Frankrig", no: "Frankrike" } },
  { code: "ES", gdpPppThousands: 57.28, name: { sv: "Spanien", en: "Spain", da: "Spanien", no: "Spania" } },
  { code: "PT", gdpPppThousands: 50.08, name: { sv: "Portugal", en: "Portugal", da: "Portugal", no: "Portugal" } },
  { code: "IT", gdpPppThousands: 63.51, name: { sv: "Italien", en: "Italy", da: "Italien", no: "Italia" } },
  { code: "GB", gdpPppThousands: 65.76, name: { sv: "Storbritannien", en: "United Kingdom", da: "Storbritannien", no: "Storbritannia" } },
  { code: "US", gdpPppThousands: 90.27, name: { sv: "USA", en: "United States", da: "USA", no: "USA" } },
  { code: "JP", gdpPppThousands: 57.04, name: { sv: "Japan", en: "Japan", da: "Japan", no: "Japan" } },
  { code: "MX", gdpPppThousands: 25.68, name: { sv: "Mexiko", en: "Mexico", da: "Mexico", no: "Mexico" } },
  { code: "BR", gdpPppThousands: 23.36, name: { sv: "Brasilien", en: "Brazil", da: "Brasilien", no: "Brasil" } },
  { code: "PL", gdpPppThousands: 55.94, name: { sv: "Polen", en: "Poland", da: "Polen", no: "Polen" } },
  { code: "NL", gdpPppThousands: 84.45, name: { sv: "Nederländerna", en: "Netherlands", da: "Nederlandene", no: "Nederland" } },
  { code: "TR", gdpPppThousands: 44.21, name: { sv: "Turkiet", en: "Turkey", da: "Tyrkiet", no: "Tyrkia" } },
  { code: "IN", gdpPppThousands: 11.85, name: { sv: "Indien", en: "India", da: "Indien", no: "India" } },
];

export function roundHalfUp(value: number, step: number): number {
  if (!(step > 0)) throw new Error("step must be positive");
  const units = value / step;
  const sign = units < 0 ? -1 : 1;
  const roundedUnits = Math.floor(Math.abs(units) + 0.5) * sign;
  const decimals = (step.toString().split(".")[1] || "").length;
  return Number((roundedUnits * step).toFixed(decimals));
}

export function referenceGdp(): number {
  const row = countries.find((c) => c.code === pricingConfig.referenceCountryCode);
  if (!row) throw new Error("Reference country is missing from the price table");
  return row.gdpPppThousands;
}

export function monthlyPriceFromGdp(gdpPppThousands: number): number {
  const raw =
    pricingConfig.basePriceEur *
    Math.pow(gdpPppThousands / referenceGdp(), pricingConfig.sensitivity);
  const rounded = roundHalfUp(raw, pricingConfig.stepEur);
  return Math.min(pricingConfig.ceilingEur, Math.max(pricingConfig.floorEur, rounded));
}

export function countryByCode(code: string | null | undefined): CountryPriceRow | null {
  if (!code) return null;
  return countries.find((c) => c.code === code.toUpperCase()) ?? null;
}

export function isSoldCountry(code: string | null | undefined): boolean {
  return countryByCode(code) !== null;
}

export const CHOSEN_COUNTRY_KEY = "kemkvitto-country";

export function monthlyPriceEur(countryCode: string | null | undefined): number | null {
  const country = countryByCode(countryCode);
  if (!country) return null;
  return monthlyPriceFromGdp(country.gdpPppThousands);
}

/** Full amount charged once per year, in EUR. */
export function yearlyPriceEur(countryCode: string): number | null {
  const monthly = monthlyPriceEur(countryCode);
  if (monthly === null) return null;
  const cents = Math.round(monthly * 100);
  const yearlyCents = Math.round(cents * 12 * (1 - pricingConfig.yearlyDiscount));
  return yearlyCents / 100;
}

export function priceCents(countryCode: string, interval: BillingInterval): number | null {
  const eur = interval === "year" ? yearlyPriceEur(countryCode) : monthlyPriceEur(countryCode);
  if (eur === null) return null;
  return Math.round(eur * 100);
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
