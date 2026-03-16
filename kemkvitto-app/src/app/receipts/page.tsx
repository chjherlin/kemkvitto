"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

interface Receipt {
  id: string;
  receipt_number: number;
  tag_number?: string | null;
  garments: Record<string, number | { qty: number; bet: boolean }>;
  delivery_date: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  comment: string | null;
  created_at: string;
  payment_status: string;
  amount_total: number;
  paid?: boolean;
  services?: string[];
}

export default function ReceiptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, tGarment } = useI18n();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "number">("date");
  const [brandColor, setBrandColor] = useState("#82C58A");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Get brand color
    fetch("/api/receipts/next-number")
      .then((r) => r.json())
      .then((d) => d.brandColor && setBrandColor(d.brandColor));

    fetch("/api/receipts/list")
      .then((r) => r.json())
      .then((data) => {
        setReceipts(data.receipts || []);
        setLoading(false);
      });
  }, [status]);

  const filtered = searchQuery.trim()
    ? receipts.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          (r.customer_email || "").toLowerCase().includes(q) ||
          (r.customer_name || "").toLowerCase().includes(q) ||
          (r.customer_phone || "").toLowerCase().includes(q) ||
          String(r.receipt_number).includes(q)
        );
      })
    : receipts;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "number") return b.receipt_number - a.receipt_number;
    return new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime();
  });

  // Group by delivery date
  const grouped = sorted.reduce<Record<string, Receipt[]>>((acc, r) => {
    const key = sortBy === "date" ? r.delivery_date : "all";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const today = new Date().toISOString().split("T")[0];

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
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${brandColor}12 0%, ${brandColor}06 50%, var(--bg) 100%)`, minHeight: '100vh' }}>
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
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            ← {t("nav.newReceipt")}
          </Link>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {t("receipts.title")}
          </h1>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("receipts.search")}
            className="rounded-lg border-2 px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--border)", minWidth: "12rem" }}
          />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)" }}>
              {(["date", "number"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: sortBy === s ? brandColor : "transparent",
                    color: sortBy === s ? "white" : "var(--text-muted)",
                  }}
                >
                  {s === "date" ? t("receipts.sortDate") : t("receipts.sortNumber")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {receipts.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg">{t("receipts.empty")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg">{t("receipts.noResults")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, items]) => (
              <div key={dateKey}>
                {sortBy === "date" && (
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-receipt text-sm font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {dateKey === today ? `${t("receipts.today")} — ${dateKey}` : dateKey}
                    </h2>
                    {dateKey === today && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        {items.length}
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  {items.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border-2 bg-white p-4"
                      style={{
                        borderColor: r.delivery_date === today ? brandColor : "var(--border)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className="font-receipt text-lg font-bold"
                            style={{ color: brandColor }}
                          >
                            #{r.receipt_number}
                          </span>
                          {r.customer_name && (
                            <span className="ml-3 text-sm font-medium" style={{ color: "var(--text)" }}>
                              {r.customer_name}
                            </span>
                          )}
                          <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
                            {r.customer_email || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.amount_total > 0 && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-bold"
                              style={{
                                backgroundColor: r.payment_status === "paid" ? "#dcfce7" : r.payment_status === "failed" ? "#fef2f2" : "#fef9c3",
                                color: r.payment_status === "paid" ? "#16a34a" : r.payment_status === "failed" ? "#dc2626" : "#ca8a04",
                              }}
                            >
                              {r.payment_status === "paid" ? t("receipts.paid") : r.payment_status === "failed" ? t("receipts.failed") : t("receipts.unpaid")}
                            </span>
                          )}
                          <span className="font-receipt text-sm" style={{ color: "var(--text-light)" }}>
                            {r.delivery_date}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(r.garments).map(([name, val]) => {
                          const qty = typeof val === "number" ? val : val.qty;
                          return (
                            <span
                              key={name}
                              className="rounded-lg px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${brandColor} 8%, white)`,
                                color: brandColor,
                              }}
                            >
                              {tGarment(name)} {qty > 1 ? `x${qty}` : ""}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.services && r.services.map((svc: string) => (
                          <span key={svc} className="rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                            {t(`service.${svc}` as any) || svc}
                          </span>
                        ))}
                        <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold" style={{
                          backgroundColor: r.paid ? "#dcfce7" : "#fef9c3",
                          color: r.paid ? "#16a34a" : "#ca8a04",
                        }}>
                          {r.paid ? t("payment.betald" as any) : t("payment.ejBetald" as any)}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
