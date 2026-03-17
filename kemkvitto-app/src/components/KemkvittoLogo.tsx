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
    sm: { iconH: 20, iconW: 16, fontSize: "1.0625rem", gap: "0.25rem" },
    md: { iconH: 32, iconW: 25, fontSize: "1.625rem",  gap: "0.35rem" },
    lg: { iconH: 52, iconW: 41, fontSize: "2.625rem",  gap: "0.55rem" },
  };

  const s = sizes[size];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
      {/*
        Receipt icon — solid fill with a punched-out square in the upper-left.
        Uses SVG evenodd fill rule: the inner rect path punches a transparent hole
        through the outer shape, so it works on any background color.

        Outer shape: portrait rectangle (20×26) with bottom-right step notch
          M0,0 H20 V19 H13 V26 H0 Z
        Inner cutout: small square (upper-left, like a receipt photo/stamp area)
          M2.5,2.5 H9.5 V10.5 H2.5 Z
      */}
      <svg
        width={s.iconW}
        height={s.iconH}
        viewBox="0 0 20 26"
        fill="none"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path
          d="M0,0 H20 V19 H13 V26 H0 Z M2.5,2.5 H9.5 V10.5 H2.5 Z"
          fill={color}
          fillRule="evenodd"
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
