"use client";

import { useEffect, useState, useCallback } from "react";
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
  drop_off_date?: string | null;
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

function getQty(val: number | { qty: number; bet: boolean }): number {
  return typeof val === "number" ? val : val.qty;
}

interface EditModalProps {
  receipt: Receipt;
  brandColor: string;
  garmentList: string[];
  priceList: Record<string, number>;
  onSave: (updated: Partial<Receipt>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function EditModal({ receipt, brandColor, garmentList, priceList, onSave, onDelete, onClose }: EditModalProps) {
  const { t, tGarment } = useI18n();
  const [garments, setGarments] = useState<Record<string, number>>(() => {
    const g: Record<string, number> = {};
    for (const [k, v] of Object.entries(receipt.garments)) {
      g[k] = getQty(v);
    }
    return g;
  });
  const [services, setServices] = useState<string[]>(receipt.services ?? []);
  const [deliveryDate, setDeliveryDate] = useState(receipt.delivery_date);
  const [customerName, setCustomerName] = useState(receipt.customer_name ?? "");
  const [customerEmail, setCustomerEmail] = useState(receipt.customer_email ?? "");
  const [comment, setComment] = useState(receipt.comment ?? "");
  const [addGarment, setAddGarment] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const serviceKeys = ["pressning", "starkning", "vikning", "express"] as const;
  const svcNameMap: Record<string, string> = { pressning: "Pressning", starkning: "Stärkning", vikning: "Vikning", express: "Express" };

  const grandTotal = Object.entries(garments).reduce((sum, [name, qty]) => sum + qty * (priceList[name] ?? 0), 0)
    + services.reduce((sum, svc) => sum + (priceList[svcNameMap[svc] ?? ""] ?? 0), 0);

  function setQty(name: string, qty: number) {
    if (qty <= 0) {
      setGarments(prev => { const n = { ...prev }; delete n[name]; return n; });
    } else {
      setGarments(prev => ({ ...prev, [name]: qty }));
    }
  }

  function handleAddGarment() {
    if (!addGarment || garments[addGarment] !== undefined) return;
    setGarments(prev => ({ ...prev, [addGarment]: 1 }));
    setAddGarment("");
  }

  async function handleSave() {
    setSaving(true);
    const garmentsOut: Record<string, { qty: number }> = {};
    for (const [k, qty] of Object.entries(garments)) {
      garmentsOut[k] = { qty };
    }
    await onSave({ garments: garmentsOut as unknown as Record<string, number>, services, delivery_date: deliveryDate, customer_name: customerName, customer_email: customerEmail, comment, amount_total: grandTotal * 100 });
    setSaving(false);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.5rem",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700, color: brandColor }}>
              #{receipt.receipt_number}
            </span>
            {receipt.customer_name && (
              <span style={{ marginLeft: "0.75rem", fontWeight: 600, color: "var(--text)" }}>{receipt.customer_name}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-light)", lineHeight: 1 }}
          >×</button>
        </div>

        {/* Garments */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="pos-section-label">Plagg</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {Object.entries(garments).map(([name, qty]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{tGarment(name)}</span>
                <button type="button" onClick={() => setQty(name, qty - 1)} className="pos-qty-btn">−</button>
                <span style={{ fontFamily: "'JetBrains Mono'", width: "2rem", textAlign: "center", fontWeight: 700, color: brandColor }}>{qty}</span>
                <button type="button" onClick={() => setQty(name, qty + 1)} className="pos-qty-btn">+</button>
                <button type="button" onClick={() => setQty(name, 0)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", fontSize: "1rem", padding: "0 0.25rem" }}>×</button>
              </div>
            ))}
          </div>
          {/* Add garment */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem" }}>
            <select
              value={addGarment}
              onChange={(e) => setAddGarment(e.target.value)}
              className="pos-input"
              style={{ flex: 1, fontSize: "0.8125rem" }}
            >
              <option value="">— Lägg till plagg —</option>
              {garmentList.filter(g => garments[g] === undefined).map(g => (
                <option key={g} value={g}>{tGarment(g)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddGarment}
              disabled={!addGarment}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: addGarment ? brandColor : "var(--border)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: addGarment ? "pointer" : "default",
              }}
            >+</button>
          </div>
        </div>

        {/* Services */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="pos-section-label">{t("receipt.services" as Parameters<typeof t>[0]) || "Tjänster"}</div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {serviceKeys.map((svc) => {
              const active = services.includes(svc);
              return (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setServices(active ? services.filter(s => s !== svc) : [...services, svc])}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: `2px solid ${active ? brandColor : "var(--border)"}`,
                    backgroundColor: active ? `color-mix(in srgb, ${brandColor} 12%, white)` : "var(--bg-card)",
                    color: active ? brandColor : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  {active && "✓ "}{t(`service.${svc}` as Parameters<typeof t>[0])}
                  {priceList[svcNameMap[svc]] ? ` ${priceList[svcNameMap[svc]]} kr` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery date */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="pos-section-label">{t("receipt.ready")}</div>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="pos-input"
            style={{ width: "100%" }}
          />
        </div>

        {/* Customer */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="pos-section-label">{t("receipt.customer")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Kundnamn"
              className="pos-input"
              style={{ width: "100%" }}
            />
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="E-post"
              className="pos-input"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Comment */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="pos-section-label">{t("receipt.comment")}</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="pos-comment"
            style={{ width: "100%" }}
            placeholder={t("receipt.commentPlaceholder")}
          />
        </div>

        {/* Total */}
        {grandTotal > 0 && (
          <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Totalt: <span style={{ fontWeight: 700, color: brandColor }}>{grandTotal} kr</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {confirmDelete ? (
            <>
              <span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--danger)", display: "flex", alignItems: "center" }}>
                Ta bort kvitto #{receipt.receipt_number}?
              </span>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ padding: "0.625rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                Avbryt
              </button>
              <button type="button" onClick={onDelete}
                style={{ padding: "0.625rem 1rem", borderRadius: "0.5rem", border: "none", backgroundColor: "var(--danger)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
                Ta bort
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirmDelete(true)}
                style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.8125rem" }}>
                Ta bort
              </button>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: "0.625rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                Avbryt
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: "0.625rem", borderRadius: "0.5rem", border: "none", backgroundColor: saving ? "var(--border)" : brandColor, color: "white", cursor: saving ? "default" : "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
                {saving ? "Sparar…" : "Spara ändringar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, tGarment } = useI18n();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "number">("date");
  const [brandColor, setBrandColor] = useState("#82C58A");
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadReceipts = useCallback(() => {
    return fetch("/api/receipts/list")
      .then((r) => r.json())
      .then((data) => setReceipts(data.receipts || []));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/receipts/next-number")
      .then((r) => r.json())
      .then((d) => {
        if (d.brandColor) setBrandColor(d.brandColor);
        if (d.priceList) setPriceList(d.priceList);
        if (d.garmentList) setGarmentList(d.garmentList);
      });

    loadReceipts().then(() => setLoading(false));
  }, [status, loadReceipts]);

  const handleSave = useCallback(async (updated: Partial<Receipt>) => {
    if (!editingReceipt) return;
    const res = await fetch(`/api/receipts/${editingReceipt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        garments: updated.garments,
        services: updated.services,
        deliveryDate: updated.delivery_date,
        customerName: updated.customer_name,
        customerEmail: updated.customer_email,
        comment: updated.comment,
        amountTotal: updated.amount_total,
      }),
    });
    if (res.ok) {
      await loadReceipts();
      setEditingReceipt(null);
      setSaveMsg("Sparat!");
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }, [editingReceipt, loadReceipts]);

  const handleDelete = useCallback(async () => {
    if (!editingReceipt) return;
    const res = await fetch(`/api/receipts/${editingReceipt.id}`, { method: "DELETE" });
    if (res.ok) {
      await loadReceipts();
      setEditingReceipt(null);
    }
  }, [editingReceipt, loadReceipts]);

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
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}0a 50%, var(--bg) 100%)`, minHeight: "100vh" }}>
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            ← {t("nav.newReceipt")}
          </Link>
          <h1 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
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

      {saveMsg && (
        <div style={{ position: "fixed", top: "4rem", left: "50%", transform: "translateX(-50%)", background: brandColor, color: "white", padding: "0.5rem 1.25rem", borderRadius: "999px", fontWeight: 700, zIndex: 60, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {saveMsg}
        </div>
      )}

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
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: brandColor }}>
                        {items.length}
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  {items.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setEditingReceipt(r)}
                      className="rounded-xl border-2 bg-white p-4 text-left w-full"
                      style={{
                        borderColor: r.delivery_date === today ? brandColor : "var(--border)",
                        cursor: "pointer",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-receipt text-lg font-bold" style={{ color: brandColor }}>
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
                          <span style={{ color: "var(--text-light)", fontSize: "0.75rem" }}>✎</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(r.garments).map(([name, val]) => {
                          const qty = getQty(val);
                          return (
                            <span
                              key={name}
                              className="rounded-lg px-2 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${brandColor} 8%, white)`,
                                color: brandColor,
                              }}
                            >
                              {tGarment(name)} {qty > 1 ? `×${qty}` : ""}
                            </span>
                          );
                        })}
                      </div>
                      {(r.services && r.services.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.services.map((svc: string) => (
                            <span key={svc} className="rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                              {t(`service.${svc}` as Parameters<typeof t>[0]) || svc}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.comment && (
                        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          {r.comment}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {editingReceipt && (
        <EditModal
          receipt={editingReceipt}
          brandColor={brandColor}
          garmentList={garmentList}
          priceList={priceList}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingReceipt(null)}
        />
      )}
    </div>
  );
}
