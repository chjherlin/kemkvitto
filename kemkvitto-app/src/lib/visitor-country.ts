import { headers } from "next/headers";

/** Country from the host, for example Vercel's x-vercel-ip-country. Not a price. */
export async function detectedCountryCode(): Promise<string | null> {
  const headerList = await headers();
  const code = headerList.get("x-vercel-ip-country");
  if (!code) return null;
  return code.toUpperCase();
}
