/** Reserved key inside washers.price_list. Absent means prices are shown. */
export const SHOW_PRICES_KEY = "__showPrices";

/**
 * Prices stay on unless the laundry has explicitly turned them off.
 * A missing key, null, or any value other than 0/false keeps the current behaviour.
 */
export function pricesEnabled(
  priceList: Record<string, unknown> | null | undefined
): boolean {
  if (!priceList || typeof priceList !== "object") return true;
  const flag = priceList[SHOW_PRICES_KEY];
  return flag !== 0 && flag !== false;
}
