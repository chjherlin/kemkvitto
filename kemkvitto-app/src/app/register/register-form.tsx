"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { CHOSEN_COUNTRY_KEY, countries, formatEur, monthlyPriceEur, pricingConfig } from "@/lib/pricing";
import { PALETTE, brandTheme, type Strength } from "@/lib/brand";
import { defaultLandingBrand, readBrandChoice } from "@/lib/brand-choice";

const COLOUR_KEY = {
  green: "color.green",
  blue: "color.blue",
  orange: "color.orange",
  teal: "color.teal",
  brown: "color.brown",
  yellow: "color.yellow",
  purple: "color.purple",
  pink: "color.pink",
  red: "color.red",
  grey: "color.grey",
} as const;

export default function RegisterForm({ detectedCountry = null }: { detectedCountry?: string | null }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandHex, setBrandHex] = useState(defaultLandingBrand);

  useEffect(() => {
    setBrandHex(readBrandChoice());
    try {
      const stored = localStorage.getItem(CHOSEN_COUNTRY_KEY);
      if (stored) setCountryCode(stored);
    } catch { /* ignore */ }
  }, []);

  const theme = brandTheme(brandHex);
  const baseId = (PALETTE.find((color) => color.hex.toLowerCase() === theme.base.toLowerCase())?.id ?? "blue") as keyof typeof COLOUR_KEY;
  const strength: Strength = theme.strength ?? "strong";
  const strengthLabel = strength === "damped"
    ? t("settings.strengthDamped")
    : strength === "strong"
      ? t("settings.strengthStrong")
      : t("settings.strengthStandard");
  const activeCountry = countryCode || detectedCountry || "";
  const monthly = activeCountry ? monthlyPriceEur(activeCountry) : null;
  const countryName = countries.find((country) => country.code === activeCountry)?.name[locale]
    || countries.find((country) => country.code === activeCountry)?.name.en;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        businessName,
        countryCode,
        locale,
        brandColor: theme.brand,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("auth.registerError"));
      setLoading(false);
      return;
    }

    try {
      sessionStorage.setItem("kemkvitto-pending-login-email", email.trim());
    } catch {
      // Confirmation still works if storage is blocked.
    }
    router.push("/login?registered=1");
  }

  return (
    <div style={{ background: theme.tint, color: "#1c1917", minHeight: "100vh" }}>
      <header style={{ background: theme.bar, color: theme.barInk }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/login" aria-label="Kemkvitto">
            <KemkvittoLogo color={theme.barInk} size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle color={theme.barInk} />
            <Link href="/login" className="text-base font-semibold" style={{ color: theme.barInk, minHeight: "56px", display: "inline-flex", alignItems: "center" }}>
              {t("auth.login")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex justify-center px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl bg-white p-6"
          style={{ maxWidth: "410px", border: "1px solid #e7e5e4" }}
        >
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-jost), sans-serif" }}>{t("auth.registerSubtitle")}</h1>
          <p className="mt-2 text-base" style={{ color: "#44403c" }}>
            {pricingConfig.trialDays} {t("landing.trialDays")} {t("auth.registerLead")}
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-xl p-4 text-base" style={{ background: "#fef2f2", color: "#7f1d1d" }}>{error}</p>
          )}

          <label className="mt-5 block text-base font-medium">
            {t("auth.businessName")}
            <input
              type="text"
              placeholder={t("landing.exampleBusiness")}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
              style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
            />
          </label>
          <label className="mt-4 block text-base font-medium">
            {t("auth.email")}
            <input
              type="email"
              placeholder={t("landing.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
              style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
            />
          </label>
          <label className="mt-4 block text-base font-medium">
            {t("auth.password")}
            <input
              type="password"
              placeholder={t("auth.passwordMinLength")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
              style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
            />
          </label>
          <label className="mt-4 block text-base font-medium">
            {t("auth.country")}
            <select
              value={countryCode}
              onChange={(e) => {
                const next = e.target.value;
                setCountryCode(next);
                try {
                  if (next) localStorage.setItem(CHOSEN_COUNTRY_KEY, next);
                  else localStorage.removeItem(CHOSEN_COUNTRY_KEY);
                } catch { /* ignore */ }
              }}
              required
              className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
              style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
            >
              <option value="">{t("auth.countryPlaceholder")}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name[locale] || country.name.en}
                </option>
              ))}
            </select>
          </label>

          {countryName && monthly != null && (
            <div className="mt-4 flex items-center justify-between rounded-xl px-4" style={{ background: theme.tint, minHeight: "56px" }}>
              <span className="text-base font-semibold">{countryName}</span>
              <span className="font-receipt text-base">{formatEur(monthly)} / {t("subscribe.monthly").toLowerCase()}</span>
            </div>
          )}

          <div className="mt-4 rounded-xl px-4 py-3" style={{ border: "1px solid #e7e5e4" }}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-block h-8 w-8 rounded-lg" style={{ background: theme.brand }} />
              <span className="text-base">
                {t("auth.yourColour")}: <strong>{t(COLOUR_KEY[baseId])}, {strengthLabel}</strong>
              </span>
            </div>
            <p className="mt-2 text-base">
              <Link href="/login#farg" className="font-semibold" style={{ color: "#1c1917", textDecoration: "underline" }}>{t("auth.changeColour")}</Link>
              {" "}
              <span style={{ color: "#44403c" }}>{t("auth.colourLater")}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl text-base font-bold disabled:opacity-50"
            style={{ background: theme.brand, color: theme.onBrand, minHeight: "60px" }}
          >
            {loading ? t("auth.registering") : t("landing.ctaButton")}
          </button>

          <p className="mt-4 text-center text-base">
            {t("auth.alreadyAccount")}{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#1c1917", textDecoration: "underline" }}>{t("auth.login")}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
