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
    sm: { iconH: 20, fontSize: "1.0625rem", gap: "0.3rem",  strokeW: 1.8 },
    md: { iconH: 32, fontSize: "1.625rem",  gap: "0.45rem", strokeW: 1.8 },
    lg: { iconH: 52, fontSize: "2.625rem",  gap: "0.65rem", strokeW: 1.6 },
  };

  const s = sizes[size];
  // Receipt aspect ratio from reference: ~18:24 (3:4)
  const iconW = Math.round(s.iconH * 0.75);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/*
        Receipt icon: portrait rectangle, notch at bottom-right.
        ViewBox 18×24.  Shape:
          top-left rounded corner → across top → top-right rounded corner
          → down right side to y=18 → left to x=12 (notch top edge)
          → down to y=24 → across bottom → bottom-left rounded corner
          → up left side → close
      */}
      <svg
        width={iconW}
        height={s.iconH}
        viewBox="0 0 18 24"
        fill="none"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path
          d="M2,0 H16 Q18,0 18,2 V18 H12 V24 H2 Q0,24 0,22 V2 Q0,0 2,0 Z"
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
