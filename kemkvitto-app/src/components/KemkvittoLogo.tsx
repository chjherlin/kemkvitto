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
    sm: { iconH: 20, iconW: 15, fontSize: "1.0625rem", gap: "0.25rem", strokeW: 2.4 },
    md: { iconH: 32, iconW: 24, fontSize: "1.625rem",  gap: "0.35rem", strokeW: 2.4 },
    lg: { iconH: 52, iconW: 39, fontSize: "2.625rem",  gap: "0.55rem", strokeW: 2.2 },
  };

  const s = sizes[size];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/*
        Receipt outline icon.
        Path fills the full 18×24 viewBox — overflow:visible lets the thick
        stroke render fully without being clipped at the edges.
        Shape: portrait rectangle, step notch at bottom-right.
        M0,0 → top-right (18,0) → down to notch (18,18) → step left (12,18)
        → step down (12,24) → bottom-left (0,24) → close (up left side back to 0,0)
      */}
      <svg
        width={s.iconW}
        height={s.iconH}
        viewBox="0 0 18 24"
        fill="none"
        style={{ display: "block", flexShrink: 0, overflow: "visible" }}
      >
        <path
          d="M0,0 H18 V18 H12 V24 H0 Z"
          stroke={color}
          strokeWidth={s.strokeW}
          strokeLinejoin="round"
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
