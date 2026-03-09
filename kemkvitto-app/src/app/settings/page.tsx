"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BRAND_COLORS = [
  "#0891b2", // cyan
  "#7c3aed", // purple
  "#059669", // emerald
  "#dc2626", // red
  "#ea580c", // orange
  "#d946ef", // fuchsia
  "#2563eb", // blue
  "#0d9488", // teal
  "#c026d3", // magenta
  "#e11d48", // rose
  "#4f46e5", // indigo
];

const ALL_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Bet", "Kappa", "Dräkt", "Jacka",
  "Kjol", "Ej Bet", "Poplin", "Matta", "Klänning", "Blus", "Skjorta",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brandColor, setBrandColor] = useState("#0891b2");
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setBrandColor(data.brandColor || "#0891b2");
        setPriceList(data.priceList || {});
        setBusinessName(data.businessName || "");
        setLoading(false);
      });
  }, [status]);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor, priceList, businessName }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function setPrice(garment: string, value: string) {
    const num = parseInt(value);
    const next = { ...priceList };
    if (!num || num <= 0) {
      delete next[garment];
    } else {
      next[garment] = num;
    }
    setPriceList(next);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.85)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            ← Tillbaka
          </Link>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Inställningar
          </h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brandColor }}
          >
            {saved ? "Sparat!" : saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        {/* Business name */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Företagsnamn
          </h2>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium"
            style={{ borderColor: "var(--border)" }}
          />
        </section>

        {/* Brand color */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Kvittofärg
          </h2>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setBrandColor(color)}
                className="h-12 w-12 rounded-xl transition-all"
                style={{
                  backgroundColor: color,
                  outline:
                    brandColor === color
                      ? `3px solid ${color}`
                      : "2px solid transparent",
                  outlineOffset: brandColor === color ? "3px" : "0",
                  transform: brandColor === color ? "scale(1.1)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </section>

        {/* Price list */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Prislista (kr)
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALL_GARMENTS.map((garment) => (
              <div
                key={garment}
                className="flex items-center justify-between rounded-xl border-2 bg-white px-3 py-3"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {garment}
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="—"
                  value={priceList[garment] || ""}
                  onChange={(e) => setPrice(garment, e.target.value)}
                  className="w-20 rounded-lg border bg-gray-50 px-2 py-2 text-right text-sm font-medium"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
