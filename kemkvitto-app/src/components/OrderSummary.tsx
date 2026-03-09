"use client";

const VAT_RATE = 0.25;

export interface OrderItem {
  garment: string;
  qty: number;
  bet: boolean;
  unitPrice: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  betPrice: number;
  total: number;
  brandColor: string;
  onRemove: (garment: string) => void;
  onQtyChange: (garment: string, qty: number) => void;
  onToggleTreatment: (garment: string) => void;
}

export default function OrderSummary({
  items,
  betPrice,
  total,
  brandColor,
  onRemove,
  onQtyChange,
  onToggleTreatment,
}: OrderSummaryProps) {
  if (items.length === 0) {
    return (
      <div className="pos-order-empty">
        <span style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
          Tryck på plagg till vänster
        </span>
      </div>
    );
  }

  const hasBet = items.some((i) => i.bet);
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
                {item.garment}
              </span>
            </div>
            <div className="pos-order-line-right">
              <button
                type="button"
                onClick={() => onToggleTreatment(item.garment)}
                className="pos-treatment-badge"
                style={{
                  backgroundColor: item.bet
                    ? `color-mix(in srgb, ${brandColor} 15%, white)`
                    : "var(--bg)",
                  color: item.bet ? brandColor : "var(--text-light)",
                  borderColor: item.bet ? `color-mix(in srgb, ${brandColor} 30%, white)` : "var(--border)",
                }}
              >
                {item.bet ? "Bet" : "Ej Bet"}
              </button>
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

      {/* Bet surcharge */}
      {betPrice > 0 && hasBet && (
        <div className="pos-order-line" style={{ borderTop: "1px dashed var(--border)", paddingTop: "0.5rem" }}>
          <span className="text-xs" style={{ color: "var(--text-light)" }}>Bet-tillägg</span>
          <span className="font-receipt text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {betPrice} kr
          </span>
        </div>
      )}

      {/* Totals */}
      {total > 0 && (
        <div style={{ borderTop: "2px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.625rem" }}>
          <div className="pos-order-line">
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-light)" }}>Summa</span>
            <span className="font-receipt text-lg font-bold" style={{ color: brandColor }}>
              {total} kr
            </span>
          </div>
          <div className="pos-order-line" style={{ marginTop: "-0.25rem" }}>
            <span className="text-xs" style={{ color: "var(--text-light)" }}>varav moms (25%)</span>
            <span className="font-receipt text-xs" style={{ color: "var(--text-light)" }}>
              {vatAmount} kr
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
