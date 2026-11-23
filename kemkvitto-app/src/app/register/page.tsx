import RegisterForm from "./register-form";
import { detectedCountryCode } from "@/lib/visitor-country";

export default async function RegisterPage() {
  const detectedCountry = await detectedCountryCode();
  return <RegisterForm detectedCountry={detectedCountry} />;
}
