"use client";

import { useI18n } from "@/lib/i18n";

const VAT_RATE = 0.25;

export interface OrderItem {
  garment: string;
  qty: number;
  unitPrice: number;
}

export interface ServiceLine {
  key: string;
  label: string;
  price: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  total: number;
  brandColor: string;
  onRemove: (garment: string) => void;
  onQtyChange: (garment: string, qty: number) => void;
  serviceLines?: ServiceLine[];
}

export default function OrderSummary({
  items,
  total,
  brandColor,
  onRemove,
  onQtyChange,
  serviceLines,
}: OrderSummaryProps) {
  const { t, tGarment } = useI18n();

  if (items.length === 0) {
    return (
      <div className="pos-order-empty">
        <span style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
          {t("order.empty")}
        </span>
      </div>
    );
  }

  const vatAmount = Math.round(total * VAT_RATE / (1 + VAT_RATE));

  return (
    <div className="pos-order-list">
      {items.map((item) => {
        const lineTotal = item.unitPrice * item.qty;
        return (
          <div key={item.garment} className="pos-order-line">
            <div className="pos-order-line-left">
              <div className="pos-order-qty-controls">
                <button
                  type="button"
                  className="pos-qty-btn"
                  onClick={() => {
                    if (item.qty <= 1) onRemove(item.garment);
                    else onQtyChange(item.garment, item.qty - 1);
                  }}
                  style={{ color: "var(--text-muted)" }}
                >
                  -
                </button>
                <span className="font-receipt text-sm font-bold" style={{ color: "var(--text)", minWidth: "1.5rem", textAlign: "center", display: "inline-block" }}>
                  {item.qty}
                </span>
                <button
                  type="button"
                  className="pos-qty-btn"
                  onClick={() => onQtyChange(item.garment, item.qty + 1)}
                  style={{ color: "var(--text-muted)" }}
                >
                  +
                </button>
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {tGarment(item.garment)}
              </span>
            </div>
            <div className="pos-order-line-right">
              <span className="font-receipt text-sm font-medium" style={{ color: "var(--text-muted)", minWidth: "3.5rem", textAlign: "right" }}>
                {lineTotal > 0 ? `${lineTotal} kr` : "—"}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.garment)}
                className="pos-remove-btn"
                style={{ color: "var(--text-light)" }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}

      {/* Service lines */}
      {serviceLines && serviceLines.length > 0 && (
        <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "0.375rem" }}>
          {serviceLines.map((svc) => (
            <div key={svc.key} className="pos-order-line">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {svc.label}
              </span>
              <span className="font-receipt text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {svc.price > 0 ? `${svc.price} kr` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {total > 0 && (
        <div style={{ borderTop: "2px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.625rem" }}>
          <div className="pos-order-line">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-light)" }}>{t("order.total")}</span>
            <span className="font-receipt text-lg font-bold" style={{ color: brandColor }}>
              {total} kr
            </span>
          </div>
          <div className="pos-order-line" style={{ marginTop: "-0.25rem" }}>
            <span className="text-xs" style={{ color: "var(--text-light)" }}>{t("order.vat")}</span>
            <span className="font-receipt text-xs" style={{ color: "var(--text-light)" }}>
              {vatAmount} kr
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
