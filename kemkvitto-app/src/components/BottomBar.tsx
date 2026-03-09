"use client";

interface BottomBarProps {
  garmentCount: number;
  hasBet: boolean;
  total: number;
  brandColor: string;
  submitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

export default function BottomBar({
  garmentCount,
  hasBet,
  total,
  brandColor,
  submitting,
  disabled,
  onSubmit,
}: BottomBarProps) {
  return (
    <div className="pos-bottom-bar">
      <div className="pos-bottom-info">
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          {garmentCount} plagg
        </span>
        {hasBet && (
          <span className="text-xs font-medium" style={{ color: brandColor }}>
            · Bet
          </span>
        )}
      </div>
      <div className="pos-bottom-right">
        <div className="pos-bottom-total">
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-light)" }}>
            Summa
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
          {submitting ? "Sparar..." : "Skicka till kund ▶"}
        </button>
      </div>
    </div>
  );
}
