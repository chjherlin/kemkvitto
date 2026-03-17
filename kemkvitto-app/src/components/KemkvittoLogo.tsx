"use client";

interface KemkvittoLogoProps {
  color?: string;
  size?: "sm" | "md" | "lg";
}

export default function KemkvittoLogo({
  color = "#0891b2",
  size = "md",
}: KemkvittoLogoProps) {
  const sizes = {
    sm: { iconH: 20, iconW: 15, fontSize: "1.0625rem", gap: "0.25rem", strokeW: 1.6 },
    md: { iconH: 32, iconW: 24, fontSize: "1.625rem",  gap: "0.35rem", strokeW: 1.6 },
    lg: { iconH: 52, iconW: 39, fontSize: "2.625rem",  gap: "0.55rem", strokeW: 1.5 },
  };

  const s = sizes[size];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/*
        Traced from brand PNG (~/Documents/kemkvitto.png):
        - Stroke-only (no fill) portrait rectangle with bottom-right step notch
        - Small square outline in upper-left interior
        overflow:visible ensures thick stroke isn't clipped at viewBox edges
      */}
      <svg
        width={s.iconW}
        height={s.iconH}
        viewBox="0 0 18 24"
        fill="none"
        style={{ display: "block", flexShrink: 0, overflow: "visible" }}
      >
        {/* Outer receipt shape: portrait rect with bottom-right step notch */}
        <path
          d="M0,0 H18 V18 H12 V24 H0 Z"
          stroke={color}
          strokeWidth={s.strokeW}
          strokeLinejoin="round"
          fill="none"
        />
        {/* Small square in upper-left interior */}
        <rect
          x={2.5}
          y={3}
          width={5}
          height={5.5}
          stroke={color}
          strokeWidth={s.strokeW * 0.85}
          fill="none"
        />
      </svg>

      <span
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: s.fontSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: color,
        }}
      >
        kemkvitto
      </span>
    </div>
  );
}
