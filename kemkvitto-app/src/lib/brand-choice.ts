import { applyStrength, PALETTE } from "./brand";

/** Visitor colour on the public landing page. Not sent to the server. */
export const BRAND_CHOICE_KEY = "kemkvitto-brand-choice";

export function defaultLandingBrand(): string {
  const blue = PALETTE.find((color) => color.id === "blue");
  if (!blue) return applyStrength(PALETTE[0].hex, "strong");
  return applyStrength(blue.hex, "strong");
}

export function readBrandChoice(): string {
  if (typeof window === "undefined") return defaultLandingBrand();
  try {
    const stored = localStorage.getItem(BRAND_CHOICE_KEY);
    if (stored && /^#[0-9a-fA-F]{6}$/.test(stored)) return stored.toLowerCase();
  } catch {
    // Keep the default when storage is blocked.
  }
  return defaultLandingBrand();
}

export function writeBrandChoice(hex: string): void {
  try {
    localStorage.setItem(BRAND_CHOICE_KEY, hex);
  } catch {
    // The page still updates in memory.
  }
}
