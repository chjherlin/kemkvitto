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
  garmentList: string[];  // replaces hardcoded ALL_GARMENTS
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

  const tap = useCallback((name: string) => {
    setLastTapped(name);
    const next = { ...garments };
    if (next[name]) {
      next[name] = { ...next[name], qty: next[name].qty + 1 };
    } else {
      next[name] = { qty: 1 };
    }
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
        const active = !!entry;
        const price = priceList[name] ?? 0;
        const isAnimating = lastTapped === name;

        return (
          <button
            key={name}
            type="button"
            onClick={() => tap(name)}
            onMouseDown={() => active && startLongPress(name)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={() => active && startLongPress(name)}
            onTouchEnd={cancelLongPress}
            className={`pos-garment-tile ${isAnimating ? "chip-select" : ""}`}
            style={{
              backgroundColor: active
                ? `color-mix(in srgb, ${brandColor} 12%, white)`
                : "var(--bg-card)",
              borderColor: active ? brandColor : "var(--border)",
              color: active ? brandColor : "var(--text)",
            }}
          >
            {active && entry.qty > 0 && (
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
        );
      })}
    </div>
  );
}
