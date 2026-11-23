"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import AppMenu from "@/components/AppMenu";
import WideNav from "@/components/WideNav";
import { useI18n } from "@/lib/i18n";
import { CHOSEN_COUNTRY_KEY, formatEur, monthlyPriceEur, pricingConfig, yearlyPriceEur } from "@/lib/pricing";
import { INK_DARK, INK_LIGHT, brandTheme } from "@/lib/brand";
import { figtree, jost, mono } from "@/lib/fonts";

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
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [info, setInfo] = useState<StatusResponse | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [countryCode, setCountryCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [brandHex, setBrandHex] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([
      fetch("/api/subscription/status").then((r) => r.json()),
      fetch("/api/receipts/next-number").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([data, washer]: [StatusResponse, { businessName?: string; brandColor?: string }]) => {
        setInfo(data);
        if (data.countryCode) setCountryCode(data.countryCode);
        if (washer.businessName) setBusinessName(washer.businessName);
        if (washer.brandColor) setBrandHex(washer.brandColor);
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

  const theme = brandTheme(brandHex || undefined);
  const pricedCountry = countryCode || info.countryCode || "";
  const price = pricedCountry
    ? (interval === "year" ? yearlyPriceEur(pricedCountry) : monthlyPriceEur(pricedCountry))
    : null;
  const countryName = info.countries?.find((c) => c.code === pricedCountry)?.name?.[locale]
    || info.countries?.find((c) => c.code === pricedCountry)?.name?.en;
  const savePercent = Math.round(pricingConfig.yearlyDiscount * 100);
  const perks = [t("subscribe.perkEmail"), t("subscribe.perkReady"), t("subscribe.perkCancel")];
  const displayName = businessName || session?.user?.name || "";

  return (
    <div className={figtree.className} style={{ background: theme.tint, color: "#1c1917", minHeight: "100vh", fontSize: "16px" }}>
      <header style={{ background: theme.bar, color: theme.barInk }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <KemkvittoLogo color={theme.barInk} size="sm" />
            {displayName && <span className="text-base">/ {displayName}</span>}
          </div>
          <AppMenu
            brand={theme.brand}
            onLogout={() => signOut()}
            wide={<WideNav color={theme.barInk} onLogout={() => signOut()} />}
          />
        </div>
      </header>

      <main className="flex justify-center px-4 py-10">
        <section className="w-full rounded-3xl bg-white p-6" style={{ maxWidth: "470px", border: "1px solid #e7e5e4" }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: jost.style.fontFamily }}>{t("subscribe.title")}</h1>
          <p className="mt-2 text-base" style={{ color: "#44403c" }}>
            {pricingConfig.trialDays} {t("subscribe.leadTail")}
          </p>

          {info.missingColumns && <Alert>{t("subscribe.notReady")}</Alert>}
          {info.status === "vat_missing" && <Alert>{t("subscribe.vatMissing")}</Alert>}
          {info.status === "country_mismatch" && <Alert>{t("subscribe.mismatch")}{info.billingCountryCode ? ` (${info.billingCountryCode})` : ""}</Alert>}
          {info.allowsAccess && (
            <p role="status" className="mt-4 rounded-xl p-4 text-base" style={{ backgroundColor: "#f0fdf4", color: "#14532d" }}>
              {info.status === "trialing" ? t("subscribe.trialing") : t("subscribe.active")}
            </p>
          )}
          {error && <Alert>{error}</Alert>}

          {!info.allowsAccess && (
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
                className="mt-1 w-full rounded-xl border-2 bg-white px-4 text-base"
                style={{ borderColor: "#e7e5e4", minHeight: "56px", color: "#1c1917" }}
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
          {!info.allowsAccess && countryCode && countryCode !== info.countryCode && (
            <button type="button" onClick={saveCountry} className="mt-3 w-full rounded-xl text-base font-semibold" style={{ background: theme.brand, color: theme.onBrand, minHeight: "56px" }}>
              {t("auth.country")}
            </button>
          )}

          {!info.allowsAccess && (
            <>
              <p className="mb-2 mt-6 text-sm font-bold tracking-wide" style={{ color: "#44403c" }}>{t("subscribe.payment")}</p>
              <div className="grid grid-cols-2 overflow-hidden rounded-xl" style={{ border: "1px solid #e7e5e4" }}>
                {(["month", "year"] as const).map((value) => {
                  const selected = interval === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInterval(value)}
                      className="text-base font-semibold"
                      style={{
                        minHeight: "56px",
                        background: selected ? INK_DARK : INK_LIGHT,
                        color: selected ? INK_LIGHT : INK_DARK,
                        border: "none",
                      }}
                    >
                      {value === "year" ? t("subscribe.yearly") : t("subscribe.monthly")}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {pricedCountry && (
            <div className="mt-4 rounded-xl px-4 py-4" style={{ background: theme.tint }}>
              <div className="text-sm" style={{ color: "#44403c" }}>{countryName}</div>
              {price != null && (
                <div className="mt-1 text-3xl" style={{ fontFamily: mono.style.fontFamily, fontWeight: 700 }}>
                  {formatEur(price)}
                </div>
              )}
              <p className="mt-2 text-base font-bold">
                {interval === "year"
                  ? `${t("subscribe.savePrefix")} ${savePercent} ${t("subscribe.saveSuffix")}`
                  : `${t("subscribe.freeFirst")} ${pricingConfig.trialDays} ${t("subscribe.freeDays")}`}
              </p>
            </div>
          )}

          <ul className="mt-5 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-base">
                <span aria-hidden="true" className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: theme.brand, color: theme.onBrand }}>✓</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          {!info.allowsAccess && (
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading || !info.countryCode || info.missingColumns}
              className="mt-6 w-full rounded-xl text-base font-bold disabled:opacity-50"
              style={{ background: theme.brand, color: theme.onBrand, minHeight: "60px" }}
            >
              {t("subscribe.start")}
            </button>
          )}

          {info.allowsAccess && (
            <Link href="/" className="mt-6 flex w-full items-center justify-center rounded-xl text-base font-bold" style={{ background: theme.brand, color: theme.onBrand, minHeight: "60px" }}>
              {t("subscribe.continue")}
            </Link>
          )}

          {info.hasCustomer && (
            <button type="button" onClick={openPortal} disabled={loading} className="mt-3 w-full rounded-xl border-2 text-base font-semibold" style={{ minHeight: "56px", borderColor: "#e7e5e4", color: "#1c1917", background: "#fff" }}>
              {t("subscribe.manage")}
            </button>
          )}

          <p className="mt-4 text-sm" style={{ color: "#78716c" }}>{t("subscribe.vatFooter")}</p>
        </section>
      </main>
    </div>
  );
}

function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-xl p-4 text-base" style={{ backgroundColor: "#fef2f2", color: "#7f1d1d" }}>{children}</p>
  );
}
