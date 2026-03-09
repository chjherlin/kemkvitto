"use client";

interface TreatmentModeBarProps {
  treatment: "bet" | "ej_bet";
  onTreatmentChange: (t: "bet" | "ej_bet") => void;
  betPrice: number;
  brandColor: string;
}

export default function TreatmentModeBar({
  treatment,
  onTreatmentChange,
  betPrice,
  brandColor,
}: TreatmentModeBarProps) {
  return (
    <div className="flex gap-2">
      {(["bet", "ej_bet"] as const).map((t) => {
        const active = treatment === t;
        const label = t === "bet" ? "Bet" : "Ej Bet";
        const sub = t === "bet" && betPrice > 0 ? `${betPrice} kr` : t === "ej_bet" ? "Ingen behandling" : "Fläckbehandling";

        return (
          <button
            key={t}
            type="button"
            onClick={() => onTreatmentChange(t)}
            className="pos-treatment-pill"
            style={{
              flex: 1,
              borderColor: active ? brandColor : "var(--border)",
              backgroundColor: active
                ? `color-mix(in srgb, ${brandColor} 12%, white)`
                : "var(--bg-card)",
              color: active ? brandColor : "var(--text)",
            }}
          >
            <span className="block text-base font-bold leading-tight">{label}</span>
            <span
              className="block text-xs"
              style={{ color: active ? brandColor : "var(--text-light)", opacity: active ? 0.7 : 1 }}
            >
              {sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
