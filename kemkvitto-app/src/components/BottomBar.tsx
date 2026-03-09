"use client";

import { useI18n } from "@/lib/i18n";

interface BottomBarProps {
  garmentCount: number;
  total: number;
  brandColor: string;
  submitting: boolean;
  disabled: boolean;
  customerName?: string;
  customerEmail?: string;
  onSubmit: () => void;
}

export default function BottomBar({
  garmentCount,
  total,
  brandColor,
  submitting,
  disabled,
  customerName,
  customerEmail,
  onSubmit,
}: BottomBarProps) {
  const { t } = useI18n();

  return (
    <div className="pos-bottom-bar">
      <div className="pos-bottom-info">
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          {garmentCount} {t("order.items")}
        </span>
        {customerName && (
          <span className="text-xs font-medium" style={{ color: "var(--text-light)" }}>
            · {customerName}
            {customerEmail && (
              <span style={{ color: brandColor, marginLeft: "0.25rem" }}>
                ✉
              </span>
            )}
          </span>
        )}
      </div>
      <div className="pos-bottom-right">
        <div className="pos-bottom-total">
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-light)" }}>
            {t("order.total")}
          </span>
          <span className="font-receipt text-2xl font-bold" style={{ color: brandColor }}>
            {total > 0 ? `${total} kr` : "—"}
          </span>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onSubmit}
          className="pos-submit-btn"
          style={{
            backgroundColor: disabled ? "var(--border)" : brandColor,
            color: disabled ? "var(--text-light)" : "white",
            boxShadow: disabled ? "none" : `0 4px 20px ${brandColor}40`,
          }}
        >
          {submitting ? t("order.submitting") : customerEmail ? t("order.submit") : t("order.submitSave")}
        </button>
      </div>
    </div>
  );
}
