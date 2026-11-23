"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Figtree, JetBrains_Mono, Jost } from "next/font/google";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KemkvittoLogo from "@/components/KemkvittoLogo";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { pricesEnabled } from "@/lib/prices";
import { compareReceiptNumbersDesc, formatReceiptNumber } from "@/lib/receipt-number";
import { formatLaundryMoney } from "@/lib/laundry-defaults";
import { DEFAULT_BRAND, INK_DARK, INK_LIGHT, PALETTE, brandTheme, onBrand } from "@/lib/brand";
import { formatReminderDate, garmentSummary, isPromisedDatePast, utcTodayISO } from "@/lib/reminder-list";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "600", "700"] });
const jost = Jost({ subsets: ["latin"], weight: ["700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["700"] });
const SENT_GREEN = brandTheme(PALETTE.find((c) => c.id === "green")!.hex).bar;
const GREY = PALETTE.find((c) => c.id === "grey")!.hex;
const QUIET_GREY = brandTheme(GREY).bar;

interface Receipt {
  id: string;
  receipt_number: string;
  tag_number?: string | null;
  garments: Record<string, number | { qty: number; bet: boolean }>;
  delivery_date: string;
  drop_off_date?: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  comment: string | null;
  created_at: string;
  amount_total: number;
  paid?: boolean;
  services?: string[];
  reminder_sent_at?: string | null;
}

function getQty(val: number | { qty: number; bet: boolean }): number {
  return typeof val === "number" ? val : val.qty;
}

interface EditModalProps {
  receipt: Receipt;
  brandColor: string;
  garmentList: string[];
  priceList: Record<string, number>;
  showPrices: boolean;
  countryCode?: string | null;
  onSave: (updated: Partial<Receipt>) => Promise<boolean>;
  onDelete: () => void;
  onClose: () => void;
}

function EditModal({ receipt, brandColor, garmentList, priceList, showPrices, countryCode = null, onSave, onDelete, onClose }: EditModalProps) {
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
  const shownNumber = formatReceiptNumber(receipt.receipt_number);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
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
    setSaveError("");
    const garmentsOut: Record<string, { qty: number }> = {};
    for (const [k, qty] of Object.entries(garments)) {
      garmentsOut[k] = { qty };
    }
    const ok = await onSave({ garments: garmentsOut as unknown as Record<string, number>, services, delivery_date: deliveryDate, customer_name: customerName, customer_email: customerEmail, comment, amount_total: grandTotal * 100 });
    if (!ok) setSaveError("Kunde inte spara. Försök igen.");
    setSaving(false);
  }

  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", overscrollBehavior: "none" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: "var(--bg-card)",
          borderRadius: "1.25rem 1.25rem 0 0",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            flex: "1 1 auto",
            minHeight: 0,
            maxHeight: "90dvh",
            padding: "1.5rem 1.5rem 0.75rem",
          }}
        >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.25rem", fontWeight: 700, color: brandColor }}>
              #{shownNumber}
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
                color: addGarment ? onBrand(brandColor) : "var(--text-light)",
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
                  {showPrices && priceList[svcNameMap[svc]] ? ` ${formatLaundryMoney(priceList[svcNameMap[svc]], countryCode)}` : ""}
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
        {showPrices && grandTotal > 0 && (
          <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Totalt: <span className="font-receipt" style={{ fontWeight: 700, fontSize: "1rem", color: brandColor }}>{formatLaundryMoney(grandTotal, countryCode)}</span>
          </div>
        )}

        {saveError && (
          <p style={{ color: "var(--danger)", fontSize: "0.8125rem", marginBottom: "0.5rem", textAlign: "center" }}>{saveError}</p>
        )}
        </div>
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            gap: "0.75rem",
            padding: "0.75rem 1.5rem 1.25rem",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}
        >
          {confirmDelete ? (
            <>
              <span style={{ flex: 1, fontSize: "0.8125rem", color: "var(--danger)", display: "flex", alignItems: "center" }}>
                Ta bort kvitto #{shownNumber}?
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
                style={{ minHeight: "48px", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.8125rem" }}>
                Ta bort
              </button>
              <button type="button" onClick={onClose}
                style={{ flex: 1, minHeight: "48px", padding: "0.625rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                Avbryt
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ flex: 2, minHeight: "48px", padding: "0.625rem", borderRadius: "0.5rem", border: "none", backgroundColor: saving ? "var(--border)" : brandColor, color: saving ? "var(--text-light)" : onBrand(brandColor), cursor: saving ? "default" : "pointer", fontWeight: 700, fontSize: "0.875rem" }}>
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
  const { t, tGarment, locale } = useI18n();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const showPrices = pricesEnabled(priceList);
  const theme = brandTheme(brandColor);
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState("");

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
        setCountryCode(d.countryCode ?? null);
      });

    loadReceipts().then(() => setLoading(false));
  }, [status, loadReceipts]);

  const handleSave = useCallback(async (updated: Partial<Receipt>): Promise<boolean> => {
    if (!editingReceipt) return false;
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
      return true;
    }
    const body = await res.json().catch(() => ({}));
    console.error("PATCH failed:", res.status, body);
    return false;
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
          String(r.receipt_number).includes(q) ||
          formatReceiptNumber(r.receipt_number).includes(q)
        );
      })
    : receipts;

  const sorted = [...filtered].sort((a, b) => compareReceiptNumbersDesc(a.receipt_number, b.receipt_number));
  const today = utcTodayISO();

  async function sendReminder(receipt: Receipt) {
    setSendingId(receipt.id);
    setReminderError("");
    const res = await fetch(`/api/receipts/${receipt.id}/reminder`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setSendingId(null);
    if (!res.ok) {
      setReminderError(t("receipts.reminderFailed"));
      return;
    }
    const at = body.reminderSentAt || new Date().toISOString();
    setReceipts((prev) => prev.map((row) => row.id === receipt.id ? { ...row, reminder_sent_at: at } : row));
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
    <div className={figtree.className} style={{ background: theme.tint, color: INK_DARK, minHeight: "100vh", fontSize: "16px" }}>
      <header style={{ background: theme.bar, color: theme.barInk }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" aria-label={t("nav.productPage")} style={{ color: theme.barInk }}>
            <KemkvittoLogo color={theme.barInk} size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle color={theme.barInk} />
            <span className="text-base font-bold" style={{ fontFamily: jost.style.fontFamily }}>{t("receipts.title")}</span>
          </div>
        </div>
      </header>

      {saveMsg && (
        <div style={{ position: "fixed", top: "4rem", left: "50%", transform: "translateX(-50%)", background: theme.brand, color: theme.onBrand, padding: "0.5rem 1.25rem", borderRadius: "999px", fontWeight: 700, zIndex: 60 }}>
          {saveMsg}
        </div>
      )}

      <main className="mx-auto flex w-full flex-col gap-4 px-4 py-8" style={{ maxWidth: "720px" }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: jost.style.fontFamily }}>{t("receipts.title")}</h1>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("receipts.search")}
          className="w-full rounded-xl border-2 bg-white px-4"
          style={{ borderColor: GREY, minHeight: "56px", fontSize: "16px", color: INK_DARK }}
        />
        <p className="text-base" style={{ color: QUIET_GREY }}>{t("receipts.pickedUpNote")}</p>
        {reminderError && <p role="alert" className="text-base" style={{ color: INK_DARK }}>{reminderError}</p>}

        {receipts.length === 0 ? (
          <p className="py-10 text-center text-base" style={{ color: QUIET_GREY }}>{t("receipts.empty")}</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-base" style={{ color: QUIET_GREY }}>{t("receipts.noResults")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((r) => {
              const who = (r.customer_name || "").trim() || r.customer_email || "—";
              const garments = garmentSummary(r.garments, tGarment);
              const past = isPromisedDatePast(r.delivery_date, today);
              const sentAt = r.reminder_sent_at;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl p-4"
                  style={{ background: INK_LIGHT, border: `1px solid ${GREY}` }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingReceipt(r)}
                    className="min-w-0 flex-1 text-left"
                    style={{ background: "none", border: "none", cursor: "pointer", color: INK_DARK, font: "inherit", padding: 0 }}
                  >
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span style={{ fontFamily: mono.style.fontFamily, fontWeight: 700, fontSize: "18px" }}>
                        #{formatReceiptNumber(r.receipt_number)}
                      </span>
                      <span className="text-base font-bold">{who}</span>
                    </div>
                    <p className="mt-1 text-base" style={{ color: QUIET_GREY }}>
                      {garments ? `${garments} · ` : ""}
                      {t("receipts.shouldBeReady")}{" "}
                      <span style={{ fontFamily: mono.style.fontFamily, fontWeight: 700 }}>{r.delivery_date}</span>
                    </p>
                    {sentAt && (
                      <p className="mt-1 text-base font-semibold" style={{ color: SENT_GREEN }}>
                        ✓ {t("receipts.reminderSent")} {formatReminderDate(sentAt, locale)}
                      </p>
                    )}
                  </button>
                  {past && (
                    <button
                      type="button"
                      onClick={() => sendReminder(r)}
                      disabled={sendingId === r.id}
                      className="rounded-xl px-4"
                      style={{
                        minHeight: "56px",
                        fontSize: "16px",
                        background: INK_LIGHT,
                        border: `2px solid ${sentAt ? QUIET_GREY : INK_DARK}`,
                        color: sentAt ? QUIET_GREY : INK_DARK,
                        fontWeight: sentAt ? 400 : 700,
                        cursor: sendingId === r.id ? "default" : "pointer",
                      }}
                    >
                      {sentAt ? t("receipts.sendAgain") : t("receipts.sendReminder")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {editingReceipt && (
        <EditModal
          receipt={editingReceipt}
          brandColor={brandColor}
          garmentList={garmentList}
          priceList={priceList}
          showPrices={showPrices}
          countryCode={countryCode}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingReceipt(null)}
        />
      )}
    </div>
  );
}
