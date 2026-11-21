/** Shared laundry colour. `brand_color` stores the strength-shifted hex. */

export type Strength = "damped" | "standard" | "strong";

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
}

export const PALETTE: PaletteColor[] = [
  { id: "green", name: "Grön", hex: "#82C58A" },
  { id: "blue", name: "Blå", hex: "#6BA6D2" },
  { id: "orange", name: "Orange", hex: "#EBA17D" },
  { id: "teal", name: "Blågrön", hex: "#3CB4A9" },
  { id: "brown", name: "Brun", hex: "#BA906C" },
  { id: "yellow", name: "Gul", hex: "#ECE080" },
  { id: "purple", name: "Lila", hex: "#ABA2DA" },
  { id: "pink", name: "Rosa", hex: "#EFC6D2" },
  { id: "red", name: "Röd", hex: "#E5919D" },
  { id: "grey", name: "Grå", hex: "#ACA6A2" },
];

export const STRENGTHS: Strength[] = ["damped", "standard", "strong"];

export const DEFAULT_BRAND = "#82c58a";
export const INK_DARK = "#1c1917";
export const INK_LIGHT = "#ffffff";

export interface BrandTheme {
  brand: string;
  onBrand: string;
  tint: string;
  bar: string;
  barInk: string;
  /** Palette hex the bar was derived from. */
  base: string;
  strength: Strength | null;
}

type Rgb = [number, number, number];

export function h2r(h: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

export function lum(r: number[]): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r[0]) + 0.7152 * f(r[1]) + 0.0722 * f(r[2]);
}

export function contrast(a: number[], b: number[]): number {
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function toHsl(r: number[]): [number, number, number] {
  const [R, G, B] = r.map((v) => v / 255);
  const mx = Math.max(R, G, B);
  const mn = Math.min(R, G, B);
  let h = 0;
  let s = 0;
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === R) h = ((G - B) / d) % 6;
    else if (mx === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

export function fromHsl(h: number, s: number, l: number): number[] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function hex(r: number[]): string {
  return (
    "#" +
    r
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

function asHash(c: string): string {
  const raw = c.trim();
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export function barOf(c: string): [string, string] {
  const [h, s, l] = toHsl(h2r(c));
  const d = fromHsl(h, Math.min(1, s * 1.3), l).map((v) => v * 0.7);
  return contrast(d, [255, 255, 255]) >= 3 ? [hex(d), INK_LIGHT] : [c, INK_DARK];
}

export function onBrand(c: string): string {
  return contrast(h2r(c), [255, 255, 255]) >= contrast(h2r(c), [28, 25, 23]) ? INK_LIGHT : INK_DARK;
}

export function tint(c: string): string {
  return "rgb(" + h2r(c).map((v) => Math.round(v * 0.28 + 255 * 0.72)).join(",") + ")";
}

/** Standard keeps the palette hex. Dämpad and Stark shift HSL, then clamp. */
export function applyStrength(base: string, strength: Strength): string {
  const hashed = asHash(base);
  if (strength === "standard") return hashed.toLowerCase();
  const [h, s, l] = toHsl(h2r(hashed));
  const factor = strength === "damped" ? 0.55 : 1.5;
  const shift = strength === "damped" ? 0.05 : -0.07;
  const nextS = Math.min(1, s * factor);
  const nextL = Math.min(0.92, Math.max(0.2, l + shift));
  return hex(fromHsl(h, nextS, nextL));
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

/** Palette colour whose hue is closest to the stored hex. Grey wins when the colour is nearly grey. */
export function paletteBaseFor(stored: string): string {
  const hashed = asHash(stored).toLowerCase();
  for (const color of PALETTE) {
    if (color.hex.toLowerCase() === hashed) return color.hex;
    for (const strength of STRENGTHS) {
      if (applyStrength(color.hex, strength) === hashed) return color.hex;
    }
  }
  let rgb: Rgb;
  try {
    rgb = h2r(asHash(stored));
  } catch {
    return PALETTE[0].hex;
  }
  if (rgb.some((v) => Number.isNaN(v))) return PALETTE[0].hex;
  const [h, s] = toHsl(rgb);
  if (s < 0.08) return PALETTE.find((c) => c.id === "grey")!.hex;
  let best = PALETTE[0];
  let bestDist = Infinity;
  for (const color of PALETTE) {
    const [ch] = toHsl(h2r(color.hex));
    const dist = hueDistance(ch, h);
    if (dist < bestDist) {
      bestDist = dist;
      best = color;
    }
  }
  return best.hex;
}

export function strengthOf(stored: string): Strength | null {
  const hashed = asHash(stored).toLowerCase();
  for (const color of PALETTE) {
    for (const strength of STRENGTHS) {
      if (applyStrength(color.hex, strength) === hashed) return strength;
    }
  }
  return null;
}

export function brandTheme(stored?: string | null): BrandTheme {
  const valid = stored && /^#[0-9a-fA-F]{6}$/.test(stored.trim());
  const brand = valid ? stored.trim().toLowerCase() : DEFAULT_BRAND;
  const base = paletteBaseFor(brand);
  const [bar, barInk] = barOf(base);
  return {
    brand,
    onBrand: onBrand(brand),
    tint: tint(brand),
    bar,
    barInk,
    base,
    strength: strengthOf(brand),
  };
}
