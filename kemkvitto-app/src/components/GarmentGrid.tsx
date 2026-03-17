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

  // Detect "Skjorta ×5" style tiles — tap adds N units to the base item
  function parseBulk(name: string): { base: string; qty: number } | null {
    const m = name.match(/^(.+)\s[×x](\d+)$/);
    return m ? { base: m[1], qty: parseInt(m[2]) } : null;
  }

  const tap = useCallback((name: string) => {
    setLastTapped(name);
    const bulk = parseBulk(name);
    const next = { ...garments };
    if (bulk) {
      // Add bulk.qty to the base garment (e.g. "Skjorta ×5" → adds 5 to "Skjorta")
      const base = bulk.base;
      next[base] = { qty: (next[base]?.qty ?? 0) + bulk.qty };
    } else {
      if (next[name]) {
        next[name] = { ...next[name], qty: next[name].qty + 1 };
      } else {
        next[name] = { qty: 1 };
      }
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
        const bulk = parseBulk(name);
        const entry = bulk ? garments[bulk.base] : garments[name];
        const active = bulk ? !!garments[bulk.base] : !!entry;
        const price = bulk
          ? (priceList[bulk.base] ?? 0) * bulk.qty || (priceList[name] ?? 0)
          : (priceList[name] ?? 0);
        const isAnimating = lastTapped === name;

        return (
          <button
            key={name}
            type="button"
            onClick={() => tap(name)}
            onMouseDown={() => !bulk && active && startLongPress(name)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={() => !bulk && active && startLongPress(name)}
            onTouchEnd={cancelLongPress}
            className={`pos-garment-tile ${isAnimating ? "chip-select" : ""}`}
            style={{
              backgroundColor: bulk
                ? `color-mix(in srgb, ${brandColor} 6%, white)`
                : active
                  ? `color-mix(in srgb, ${brandColor} 12%, white)`
                  : "var(--bg-card)",
              borderColor: bulk ? brandColor : active ? brandColor : "var(--border)",
              borderStyle: bulk ? "dashed" : "solid",
              color: bulk ? brandColor : active ? brandColor : "var(--text)",
              opacity: bulk ? 0.85 : 1,
            }}
          >
            {!bulk && active && entry && entry.qty > 0 && (
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
