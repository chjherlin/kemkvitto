"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { CHOSEN_COUNTRY_KEY, formatEur, monthlyPriceEur, yearlyPriceEur } from "@/lib/pricing";
import { brandTheme } from "@/lib/brand";

interface StatusResponse {
  missingColumns?: boolean;
  allowsAccess?: boolean;
  status?: string | null;
  countryCode?: string | null;
  billingCountryCode?: string | null;
  hasCustomer?: boolean;
  monthlyEur?: number | null;
  yearlyEur?: number | null;
  currentPeriodEnd?: string | null;
  countries?: { code: string; name: Record<string, string> }[];
  error?: string;
}

export default function SubscribePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [info, setInfo] = useState<StatusResponse | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [countryCode, setCountryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || hasLoaded.current) return;
    hasLoaded.current = true;
    fetch("/api/subscription/status")
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        setInfo(data);
        if (data.countryCode) setCountryCode(data.countryCode);
        void update({
          subscriptionStatus: data.status ?? null,
          currentPeriodEnd: data.currentPeriodEnd ?? null,
        });
      })
      .catch(() => setError(t("auth.registerError")));
    // update() flips status through "loading", which must not start another fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function saveCountry() {
    setError("");
    const res = await fetch("/api/subscription/country", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t("auth.registerError"));
      return;
    }
    setInfo((prev) => ({
      ...(prev || {}),
      countryCode,
      monthlyEur: data.monthlyEur,
      yearlyEur: data.yearlyEur,
      status: prev?.status === "country_mismatch" ? null : prev?.status,
    }));
  }

  async function startCheckout() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interval }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error || t("auth.registerError"));
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  async function openPortal() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/subscription/portal", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error || t("auth.registerError"));
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  if (!info) {
    return <div className="flex min-h-screen items-center justify-center" style={{ color: "#1c1917" }}>…</div>;
  }

  const theme = brandTheme();
  const pricedCountry = countryCode || info.countryCode || "";
  const price = pricedCountry
    ? (interval === "year" ? yearlyPriceEur(pricedCountry) : monthlyPriceEur(pricedCountry))
    : null;
  const countryName = info.countries?.find((c) => c.code === pricedCountry)?.name?.[locale]
    || info.countries?.find((c) => c.code === pricedCountry)?.name?.en;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10" style={{ color: "#1c1917" }}>
      <h1 className="text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{t("subscribe.title")}</h1>
      <p>{t("subscribe.lead")}</p>
      <p>{t("subscribe.businessVat")}</p>
      <p className="text-sm" style={{ color: "#44403c" }}>{t("subscribe.reverseCharge")}</p>

      {info.missingColumns && (
        <p role="alert" className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d" }}>
          {t("subscribe.notReady")}
        </p>
      )}
      {info.status === "vat_missing" && (
        <p role="alert" className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d" }}>
          {t("subscribe.vatMissing")}
        </p>
      )}
      {info.status === "country_mismatch" && (
        <p role="alert" className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d" }}>
          {t("subscribe.mismatch")}
          {info.billingCountryCode ? ` (${info.billingCountryCode})` : ""}
        </p>
      )}
      {info.allowsAccess && (
        <p role="status" className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#f0fdf4", color: "#14532d" }}>
          {info.status === "trialing" ? t("subscribe.trialing") : t("subscribe.active")}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d" }}>{error}</p>
      )}

      {!info.allowsAccess && (
        <label className="block text-sm font-medium">
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
            className="mt-1 w-full rounded-xl border-2 bg-white px-4 py-4 text-lg"
            style={{ borderColor: "var(--border)", minHeight: "48px", color: "#1c1917" }}
          >
            <option value="">{t("auth.countryPlaceholder")}</option>
            {(info.countries || []).map((country) => (
              <option key={country.code} value={country.code}>
                {country.name[locale] || country.name.en}
              </option>
            ))}
          </select>
        </label>
      )}

      {price != null && (
        <p className="text-lg font-semibold">
          {countryName}: {formatEur(price)} / {interval === "year" ? t("subscribe.yearly") : t("subscribe.monthly")}
        </p>
      )}

      {!info.allowsAccess && (
        <div className="flex gap-3">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className="rounded-xl border-2 px-4 py-3 text-base font-semibold"
              style={{
                minHeight: "48px",
                borderColor: interval === value ? "#14532d" : "#d6d3d1",
                backgroundColor: interval === value ? "#f0fdf4" : "#fff",
                color: "#1c1917",
              }}
            >
              {value === "year" ? t("subscribe.yearly") : t("subscribe.monthly")}
            </button>
          ))}
        </div>
      )}

      {!info.allowsAccess && countryCode && countryCode !== info.countryCode && (
        <button type="button" onClick={saveCountry} className="rounded-xl px-4 py-3 text-base font-semibold text-white" style={{ backgroundColor: "#44403c", minHeight: "48px" }}>
          {t("auth.country")}
        </button>
      )}

      {!info.allowsAccess && (
        <button
          type="button"
          onClick={startCheckout}
          disabled={loading || !info.countryCode || info.missingColumns}
          className="rounded-xl px-4 py-4 text-lg font-bold disabled:opacity-50"
          style={{ backgroundColor: theme.brand, color: theme.onBrand, minHeight: "48px" }}
        >
          {t("subscribe.start")}
        </button>
      )}

      {info.allowsAccess && (
        <Link href="/" className="rounded-xl px-4 py-4 text-center text-lg font-bold" style={{ backgroundColor: theme.brand, color: theme.onBrand, minHeight: "48px" }}>
          {t("subscribe.continue")}
        </Link>
      )}

      {info.hasCustomer && (
        <button type="button" onClick={openPortal} disabled={loading} className="rounded-xl border-2 px-4 py-3 text-base font-semibold" style={{ minHeight: "48px", borderColor: "#d6d3d1", color: "#1c1917" }}>
          {t("subscribe.manage")}
        </button>
      )}
    </div>
  );
}
