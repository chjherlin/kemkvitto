"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Receipt {
  id: string;
  receipt_number: number;
  garments: Record<string, number | { qty: number; bet: boolean }>;
  delivery_date: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  comment: string | null;
  created_at: string;
}

export default function ReceiptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "number">("date");
  const [brandColor, setBrandColor] = useState("#0891b2");

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

  const sorted = [...receipts].sort((a, b) => {
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
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            ← Nytt kvitto
          </Link>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Kvitton
          </h1>
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
                {s === "date" ? "Datum" : "Nummer"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {receipts.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg">Inga kvitton annu</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, items]) => (
              <div key={dateKey}>
                {sortBy === "date" && (
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-receipt text-sm font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
                      {dateKey === today ? `Idag — ${dateKey}` : dateKey}
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
                        <span className="font-receipt text-sm" style={{ color: "var(--text-light)" }}>
                          {r.delivery_date}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(r.garments).map(([name, val]) => {
                          const qty = typeof val === "number" ? val : val.qty;
                          const bet = typeof val === "object" && val.bet;
                          return (
                            <span
                              key={name}
                              className="rounded-lg px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${brandColor} 8%, white)`,
                                color: brandColor,
                              }}
                            >
                              {name} {qty > 1 ? `x${qty}` : ""}{bet ? " Bet" : ""}
                            </span>
                          );
                        })}
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
