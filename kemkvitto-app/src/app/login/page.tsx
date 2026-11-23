import LandingPage from "@/components/LandingPage";
import { detectedCountryCode } from "@/lib/visitor-country";

export default async function LoginPage() {
  const detectedCountry = await detectedCountryCode();
  return <LandingPage detectedCountry={detectedCountry} />;
}
