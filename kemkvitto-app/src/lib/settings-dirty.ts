/** Compare the settings form with the last saved values. No database access. */

export interface SettingsSnapshot {
  brandColor: string;
  businessName: string;
  priceList: Record<string, number>;
  garmentList: string[];
  serviceList: string[];
  receiptNumber: string;
}

function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function samePrices(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function settingsAreDirty(current: SettingsSnapshot, saved: SettingsSnapshot): boolean {
  if (current.businessName !== saved.businessName) return true;
  if (current.brandColor.toLowerCase() !== saved.brandColor.toLowerCase()) return true;
  if (current.receiptNumber !== saved.receiptNumber) return true;
  if (!sameList(current.garmentList, saved.garmentList)) return true;
  if (!sameList(current.serviceList, saved.serviceList)) return true;
  if (!samePrices(current.priceList, saved.priceList)) return true;
  return false;
}

export function cloneSettings(snapshot: SettingsSnapshot): SettingsSnapshot {
  return {
    brandColor: snapshot.brandColor,
    businessName: snapshot.businessName,
    receiptNumber: snapshot.receiptNumber,
    priceList: { ...snapshot.priceList },
    garmentList: [...snapshot.garmentList],
    serviceList: [...snapshot.serviceList],
  };
}
