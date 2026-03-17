"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

export interface GarmentEntry {
  qty: number;
}

interface GarmentGridProps {
  garments: Record<string, GarmentEntry>;
  onChange: (garments: Record<string, GarmentEntry>) => void;
  priceList: Record<string, number>;
  brandColor: string;
  garmentList: string[];
}

export default function GarmentGrid({
  garments,
  onChange,
  priceList,
  brandColor,
  garmentList,
}: GarmentGridProps) {
  const { tGarment } = useI18n();
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const addQty = useCallback((name: string, qty: number) => {
    setLastTapped(name);
    const next = { ...garments };
    next[name] = { qty: (next[name]?.qty ?? 0) + qty };
    onChange(next);
    setTimeout(() => setLastTapped(null), 150);
  }, [garments, onChange]);

  const startLongPress = useCallback((name: string) => {
    const timer = setTimeout(() => {
      const next = { ...garments };
      delete next[name];
      onChange(next);
      setLastTapped(null);
    }, 500);
    setLongPressTimer(timer);
  }, [garments, onChange]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  return (
    <div className="pos-garment-grid-flat">
      {garmentList.map((name) => {
        const entry = garments[name];
        const active = !!entry && entry.qty > 0;
        const price = priceList[name] ?? 0;
        const isAnimating = lastTapped === name;

        return (
          <div
            key={name}
            className={`pos-garment-tile ${isAnimating ? "chip-select" : ""}`}
            style={{
              backgroundColor: active
                ? `color-mix(in srgb, ${brandColor} 12%, white)`
                : "var(--bg-card)",
              borderColor: active ? brandColor : "var(--border)",
              color: active ? brandColor : "var(--text)",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
              cursor: "default",
            }}
          >
            {/* Main tap area */}
            <button
              type="button"
              onClick={() => addQty(name, 1)}
              onMouseDown={() => active && startLongPress(name)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => active && startLongPress(name)}
              onTouchEnd={cancelLongPress}
              title={active ? "Long-press to remove" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem 0.375rem 0.25rem",
                color: "inherit",
                position: "relative",
                minHeight: 0,
              }}
            >
              {active && (
                <span
                  className="pos-tile-badge"
                  style={{ backgroundColor: brandColor }}
                >
                  ×{entry.qty}
                </span>
              )}
              <span className="pos-tile-name">{tGarment(name)}</span>
              {price > 0 && (
                <span className="pos-tile-price">{price} kr</span>
              )}
            </button>

            {/* +5 / +10 quick-add bar */}
            <div style={{
              display: "flex",
              borderTop: `1px solid ${active ? `color-mix(in srgb, ${brandColor} 30%, white)` : "var(--border)"}`,
              height: "1.875rem",
              flexShrink: 0,
              backgroundColor: active
                ? `color-mix(in srgb, ${brandColor} 6%, white)`
                : "color-mix(in srgb, var(--border) 30%, white)",
            }}>
              {[5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); addQty(name, n); }}
                  title={`Add ${n}`}
                  style={{
                    flex: 1,
                    padding: 0,
                    background: "none",
                    border: "none",
                    borderRight: n === 5 ? `1px solid ${active ? `color-mix(in srgb, ${brandColor} 30%, white)` : "var(--border)"}` : "none",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: active ? brandColor : "var(--text-light)",
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
