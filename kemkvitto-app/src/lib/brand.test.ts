import assert from "node:assert/strict";
import test from "node:test";
import { PALETTE, STRENGTHS, applyStrength, barOf, brandTheme, onBrand, INK_DARK, INK_LIGHT } from "./brand.ts";

test("every palette colour and strength produces a hex, and only Gul uses a dark bar logo", () => {
  const rows: string[] = [];
  for (const color of PALETTE) {
    const [bar, barInk] = barOf(color.hex);
    if (color.id === "yellow") assert.equal(barInk, INK_DARK);
    else assert.equal(barInk, INK_LIGHT);
    assert.match(bar, /^#[0-9a-f]{6}$|^#[0-9A-F]{6}$/);
    for (const strength of STRENGTHS) {
      const shifted = applyStrength(color.hex, strength);
      assert.match(shifted, /^#[0-9a-f]{6}$/);
      const theme = brandTheme(shifted);
      assert.equal(theme.base.toLowerCase(), color.hex.toLowerCase());
      assert.equal(theme.strength, strength);
      assert.equal(theme.barInk, barInk);
      assert.ok(theme.onBrand === INK_LIGHT || theme.onBrand === INK_DARK);
      assert.ok(theme.tint.startsWith("rgb("));
      rows.push(`${color.name} ${strength} ${shifted} on ${theme.onBrand} bar ${theme.bar} ink ${theme.barInk}`);
    }
  }
  assert.equal(rows.length, 30);
});

test("standard strength keeps the palette hex", () => {
  for (const color of PALETTE) {
    assert.equal(applyStrength(color.hex, "standard"), color.hex.toLowerCase());
  }
});

test("strong blue is the landing default", () => {
  const blue = PALETTE.find((color) => color.id === "blue");
  assert.ok(blue);
  assert.equal(applyStrength(blue.hex, "strong"), "#319ae8");
});

test("a strength-shifted yellow still uses the yellow bar", () => {
  const shifted = applyStrength("#ECE080", "strong");
  const theme = brandTheme(shifted);
  assert.equal(theme.base.toLowerCase(), "#ece080");
  assert.equal(theme.barInk, INK_DARK);
  assert.equal(onBrand(shifted), theme.onBrand);
});
