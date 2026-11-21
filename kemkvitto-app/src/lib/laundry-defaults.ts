/**
 * Seed for a new laundry. The product page reads washers.price_list and
 * washers.garment_list. Change the numbers here; do not repeat them in the UI.
 * A package defaults to that many times the single shirt, matching the old
 * +5 / +10 buttons, which charged the shirt price once per shirt.
 */
const shirtPrice = 80;

export const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta", "5 Skjortor", "10 Skjortor",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];

export const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];

export const DEFAULT_PRICE_LIST: Record<string, number> = {
  "Rock": 250,
  "Kostym": 350,
  "Kavaj": 200,
  "Byxor": 150,
  "Kappa": 350,
  "Dräkt": 300,
  "Jacka": 250,
  "Kjol": 150,
  "Poplin": 100,
  "Matta": 400,
  "Klänning": 250,
  "Blus": 130,
  "Skjorta": shirtPrice,
  "5 Skjortor": shirtPrice * 5,
  "10 Skjortor": shirtPrice * 10,
  "Mocka": 500,
  "Slips": 80,
  "Jumper": 130,
  "Gardin": 200,
  "Vittvätt": 100,
  "Pressning": 50,
  "Stärkning": 30,
  "Vikning": 20,
  "Express": 100,
};

/** Older labels that were never real products. Keep them off the grid. */
const HIDDEN_GARMENTS = new Set(["Skjorta ×5", "Skjorta ×10"]);

export function visibleGarments(list: string[] | null | undefined): string[] {
  const source = list ?? DEFAULT_GARMENTS;
  return source.filter((name) => !HIDDEN_GARMENTS.has(name));
}
