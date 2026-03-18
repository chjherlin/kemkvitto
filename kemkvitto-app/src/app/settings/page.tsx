"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";

const BRAND_COLORS = [
  "#82C58A", // grön (green)
  "#6BA6D2", // blå (blue)
  "#EBA17D", // orange
  "#3CB4A9", // blågrön (teal)
  "#BA906C", // brun (brown)
  "#ECE080", // gul (yellow)
  "#ABA2DA", // lila (purple)
  "#EFC6D2", // rosa (pink)
  "#E5919D", // röd (red)
  "#ACA6A2", // grå (grey)
];

function ItemListEditor({
  title,
  list,
  setList,
  isService = false,
  addLabel,
  priceList,
  onRename,
  onRemove,
  onAdd,
  onPriceChange,
}: {
  title: string;
  list: string[];
  setList: (l: string[]) => void;
  isService?: boolean;
  addLabel: string;
  priceList: Record<string, number>;
  onRename: (idx: number, newName: string) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
  onPriceChange: (item: string, value: string) => void;
}) {
  return (
    <section>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {list.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              type="text"
              value={item}
              onChange={(e) => onRename(idx, e.target.value)}
              placeholder={isService ? "Tjänstnamn..." : "Plaggnamn..."}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
              style={{ color: "var(--text)" }}
            />
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item ? (priceList[item] || "") : ""}
              onChange={(e) => onPriceChange(item, e.target.value)}
              disabled={!item}
              className="w-20 rounded-lg border bg-gray-50 px-2 py-2 text-right text-sm font-medium"
              style={{ borderColor: "var(--border)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-light)" }}>kr</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: "var(--text-light)" }}
              title="Ta bort"
            >×</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:border-current"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
        {addLabel}
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  const [brandColor, setBrandColor] = useState("#82C58A");
  const [priceList, setPriceList] = useState<Record<string, number>>({});
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetNumber, setResetNumber] = useState<number | "">("");
  const [resetDone, setResetDone] = useState(false);
  const [garmentList, setGarmentList] = useState<string[]>([]);
  const [serviceList, setServiceList] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setBrandColor(data.brandColor || "#82C58A");
        setPriceList(data.priceList || {});
        setBusinessName(data.businessName || "");
        setGarmentList(data.garmentList || []);
        setServiceList(data.serviceList || []);
        setLoading(false);
      });
  }, [status]);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor, priceList, businessName, garmentList, serviceList }),
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

  function renameItem(
    list: string[],
    setList: (l: string[]) => void,
    idx: number,
    newName: string
  ) {
    const oldName = list[idx];
    const next = [...list];
    next[idx] = newName;
    setList(next);
    if (oldName && oldName !== newName && priceList[oldName] !== undefined) {
      const nextPrices = { ...priceList, [newName]: priceList[oldName] };
      delete nextPrices[oldName];
      setPriceList(nextPrices);
    }
  }

  function removeItem(list: string[], setList: (l: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  function addItem(list: string[], setList: (l: string[]) => void) {
    setList([...list, ""]);
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
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {t("nav.back")}
          </Link>
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {t("settings.title")}
          </h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {saved ? t("settings.saved") : saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        {/* Business name */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.businessName")}
          </h2>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="touch-target w-full rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium"
            style={{ borderColor: "var(--border)" }}
          />
        </section>

        {/* Receipt number */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.receiptNumber")}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={9999}
              value={resetNumber}
              onChange={(e) => {
                if (!e.target.value) { setResetNumber(""); return; }
                setResetNumber(Math.min(parseInt(e.target.value) || 1, 9999));
              }}
              placeholder={t("settings.receiptNumberPlaceholder")}
              className="touch-target flex-1 rounded-xl border-2 bg-white px-4 py-4 text-lg font-medium font-receipt"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              type="button"
              onClick={async () => {
                if (!resetNumber) return;
                await fetch("/api/receipts/reset-number", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nextReceiptNumber: resetNumber }),
                });
                setResetDone(true);
                setTimeout(() => setResetDone(false), 2000);
              }}
              disabled={!resetNumber}
              className="rounded-xl px-6 py-4 text-sm font-semibold text-white"
              style={{ backgroundColor: resetNumber ? brandColor : "var(--border)" }}
            >
              {resetDone ? t("settings.receiptNumberReset") : t("settings.receiptNumberSet")}
            </button>
          </div>
        </section>

        {/* Brand color */}
        <section>
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {t("settings.brandColor")}
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

        <ItemListEditor
          title={t("settings.priceList")}
          list={garmentList}
          setList={setGarmentList}
          addLabel={t("settings.addGarment")}
          priceList={priceList}
          onRename={(idx, name) => renameItem(garmentList, setGarmentList, idx, name)}
          onRemove={(idx) => removeItem(garmentList, setGarmentList, idx)}
          onAdd={() => addItem(garmentList, setGarmentList)}
          onPriceChange={setPrice}
        />
        <ItemListEditor
          title={t("settings.servicePrices")}
          list={serviceList}
          setList={setServiceList}
          isService
          addLabel={t("settings.addService")}
          priceList={priceList}
          onRename={(idx, name) => renameItem(serviceList, setServiceList, idx, name)}
          onRemove={(idx) => removeItem(serviceList, setServiceList, idx)}
          onAdd={() => addItem(serviceList, setServiceList)}
          onPriceChange={setPrice}
        />
      </main>
    </div>
  );
}
