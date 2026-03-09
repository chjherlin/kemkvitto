"use client";

import { useI18n } from "@/lib/i18n";

const WEEKDAYS: Record<string, string[]> = {
  sv: ["sön", "mån", "tis", "ons", "tors", "fre", "lör"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  da: ["søn", "man", "tir", "ons", "tor", "fre", "lør"],
  no: ["søn", "man", "tir", "ons", "tor", "fre", "lør"],
};

function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekdayName(dateStr: string, locale: string): string {
  if (!dateStr) return "";
  const d = parseDate(dateStr);
  return WEEKDAYS[locale][d.getDay()];
}

function countBusinessDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const start = parseDate(from);
  const end = parseDate(to);
  let count = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

interface DateStepperProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  brandColor?: string;
  readOnly?: boolean;
  fromDate?: string;
}

export function getDefaultDeliveryDate(): string {
  return toISO(addBusinessDays(new Date(), 3));
}

export default function DateStepper({
  label,
  value,
  onChange,
  brandColor,
  readOnly,
  fromDate,
}: DateStepperProps) {
  const { locale } = useI18n();

  function step(days: number) {
    if (!value) return;
    const d = parseDate(value);
    d.setDate(d.getDate() + days);
    onChange(toISO(d));
  }

  return (
    <div className="pos-date-stepper">
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-light)" }}>
        {label}
      </span>
      <div className="pos-date-row">
        {!readOnly && (
          <button
            type="button"
            onClick={() => step(-1)}
            className="pos-date-btn"
            style={{ color: "var(--text-muted)" }}
          >
            ◀
          </button>
        )}
        <div className="pos-date-display" onClick={() => {
          const input = document.createElement("input");
          input.type = "date";
          input.value = value;
          input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
          input.showPicker?.();
          input.click();
        }}>
          <span className="font-receipt text-base font-bold" style={{ color: brandColor || "var(--text)" }}>
            {value || "—"}
          </span>
          {value && (
            <>
              <span className="text-xs font-medium" style={{ color: "var(--text-light)" }}>
                ({weekdayName(value, locale)})
              </span>
              {fromDate && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: brandColor ? `color-mix(in srgb, ${brandColor} 15%, white)` : "var(--bg)",
                    color: brandColor || "var(--text-muted)",
                    fontSize: "0.625rem",
                  }}
                >
                  +{countBusinessDays(fromDate, value)}d
                </span>
              )}
            </>
          )}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => step(1)}
            className="pos-date-btn"
            style={{ color: "var(--text-muted)" }}
          >
            ▶
          </button>
        )}
      </div>
      {/* Hidden native input as fallback */}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pos-date-hidden-input"
      />
    </div>
  );
}
