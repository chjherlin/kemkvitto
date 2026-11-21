/**
 * Laundry customer prices. Not the Kemkvitto subscription (that stays in pricing.ts).
 *
 * Currency is derived from washers.country_code. Example prices are only the
 * seed for a new laundry. Sweden is the current list, with shirt packages at
 * 150 and 250 (about 1.9 and 3.1 times one shirt). Other Nordic countries are
 * that list scaled and rounded: Norway ×1.10 to the nearest 5, Denmark ×0.70
 * to the nearest 5, Finland ÷11.5 to the nearest 0.50. Their shirt packages
 * are then the local shirt price times 150/80 and 250/80, rounded the same way.
 * Any other country, or a missing country, uses the Swedish list and "kr".
 */

export type LaundryCurrency = "SEK" | "NOK" | "DKK" | "EUR";

const CURRENCY_BY_COUNTRY: Record<string, LaundryCurrency> = {
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  FI: "EUR",
};

export function laundryCurrency(countryCode: string | null | undefined): LaundryCurrency {
  if (!countryCode) return "SEK";
  return CURRENCY_BY_COUNTRY[countryCode.toUpperCase()] ?? "SEK";
}

export function currencySymbol(countryCode: string | null | undefined): "kr" | "€" {
  return laundryCurrency(countryCode) === "EUR" ? "€" : "kr";
}

/** "80 kr" or "7 €". A fraction uses a comma, as in "7,50 €". */
export function formatLaundryMoney(amount: number, countryCode: string | null | undefined): string {
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(".", ",");
  return `${text} ${currencySymbol(countryCode)}`;
}

export const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta", "5 Skjortor", "10 Skjortor",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];

export const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];

const EXAMPLE_PRICES: Record<"SE" | "NO" | "DK" | "FI", Record<string, number>> = {
  SE: {
    "Rock": 250, "Kostym": 350, "Kavaj": 200, "Byxor": 150, "Kappa": 350,
    "Dräkt": 300, "Jacka": 250, "Kjol": 150, "Poplin": 100, "Matta": 400,
    "Klänning": 250, "Blus": 130, "Skjorta": 80, "5 Skjortor": 150, "10 Skjortor": 250,
    "Mocka": 500, "Slips": 80, "Jumper": 130, "Gardin": 200, "Vittvätt": 100,
    "Pressning": 50, "Stärkning": 30, "Vikning": 20, "Express": 100,
  },
  NO: {
    "Rock": 275, "Kostym": 385, "Kavaj": 220, "Byxor": 165, "Kappa": 385,
    "Dräkt": 330, "Jacka": 275, "Kjol": 165, "Poplin": 110, "Matta": 440,
    "Klänning": 275, "Blus": 145, "Skjorta": 90, "5 Skjortor": 170, "10 Skjortor": 280,
    "Mocka": 550, "Slips": 90, "Jumper": 145, "Gardin": 220, "Vittvätt": 110,
    "Pressning": 55, "Stärkning": 35, "Vikning": 20, "Express": 110,
  },
  DK: {
    "Rock": 175, "Kostym": 245, "Kavaj": 140, "Byxor": 105, "Kappa": 245,
    "Dräkt": 210, "Jacka": 175, "Kjol": 105, "Poplin": 70, "Matta": 280,
    "Klänning": 175, "Blus": 90, "Skjorta": 55, "5 Skjortor": 105, "10 Skjortor": 170,
    "Mocka": 350, "Slips": 55, "Jumper": 90, "Gardin": 140, "Vittvätt": 70,
    "Pressning": 35, "Stärkning": 20, "Vikning": 15, "Express": 70,
  },
  FI: {
    "Rock": 21.5, "Kostym": 30.5, "Kavaj": 17.5, "Byxor": 13, "Kappa": 30.5,
    "Dräkt": 26, "Jacka": 21.5, "Kjol": 13, "Poplin": 8.5, "Matta": 35,
    "Klänning": 21.5, "Blus": 11.5, "Skjorta": 7, "5 Skjortor": 13, "10 Skjortor": 22,
    "Mocka": 43.5, "Slips": 7, "Jumper": 11.5, "Gardin": 17.5, "Vittvätt": 8.5,
    "Pressning": 4.5, "Stärkning": 2.5, "Vikning": 1.5, "Express": 8.5,
  },
};

export function examplePrices(countryCode: string | null | undefined): Record<string, number> {
  const code = (countryCode || "SE").toUpperCase();
  const table = EXAMPLE_PRICES[code as keyof typeof EXAMPLE_PRICES] ?? EXAMPLE_PRICES.SE;
  return { ...table };
}

/** Swedish seed. Kept so older imports still mean "today's Swedish list". */
export const DEFAULT_PRICE_LIST = examplePrices("SE");

const HIDDEN_GARMENTS = new Set(["Skjorta ×5", "Skjorta ×10"]);

export function visibleGarments(list: string[] | null | undefined): string[] {
  const source = list ?? DEFAULT_GARMENTS;
  return source.filter((name) => !HIDDEN_GARMENTS.has(name));
}
