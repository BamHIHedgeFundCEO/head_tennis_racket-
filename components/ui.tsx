"use client";
import React from "react";

export const ACCENT = "var(--accent)";

/** Page shell: dark bg + subtle dotted grid, content centered mobile-first. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, #000, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, #000, transparent)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(20px, 6vw, 30px) clamp(20px, 6vw, 28px) 34px",
        }}
      >
        {children}
      </div>
    </main>
  );
}

export const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: ".2em",
  color: "var(--ink-faint)",
  textTransform: "uppercase",
};

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div
      style={{
        height: 3,
        width: "100%",
        background: "rgba(255,255,255,.09)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "var(--accent)",
          borderRadius: 2,
          boxShadow: "0 0 10px var(--glow)",
          transition: "width .3s ease",
        }}
      />
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  pulse,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  pulse?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="archivo"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        height: 56,
        border: "none",
        borderRadius: 12,
        background: disabled ? "rgba(255,255,255,.12)" : "var(--accent)",
        color: disabled ? "rgba(255,255,255,.4)" : "#141414",
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: ".02em",
        cursor: disabled ? "not-allowed" : "pointer",
        animation: pulse && !disabled ? "ctaPulse 2.6s ease-in-out infinite" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        height: 46,
        background: "transparent",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 12,
        color: "var(--ink-dim)",
        fontFamily: "var(--font-noto), sans-serif",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Selectable card: outline when idle, filled + glow when selected. */
export function optionCardStyle(selected: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    width: "100%",
    padding: "15px 17px",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "all .16s ease",
    background: selected ? "var(--accent)" : "rgba(255,255,255,.02)",
    border: selected ? "1px solid var(--accent)" : "1px solid var(--hairline)",
    color: selected ? "#141414" : "#ffffff",
    boxShadow: selected ? "0 0 30px var(--glow)" : "none",
  };
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span
      style={{
        flex: "none",
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: "1.6px solid currentColor",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "currentColor",
          opacity: on ? 1 : 0,
          transition: "opacity .16s",
        }}
      />
    </span>
  );
}

export function Check({ on, square }: { on: boolean; square?: boolean }) {
  return (
    <span
      style={{
        flex: "none",
        width: 22,
        height: 22,
        borderRadius: square ? 6 : "50%",
        border: "1.6px solid currentColor",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: square ? 2 : "50%",
          background: "currentColor",
          opacity: on ? 1 : 0,
          transition: "opacity .16s",
        }}
      />
    </span>
  );
}

/** Wireframe-racquet placeholder (real 3D lands in build step 6). */
export function RacquetPlaceholder({ size = 200 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size * 1.62,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 100 162" width="100%" height="100%" fill="none">
        <ellipse cx="50" cy="46" rx="38" ry="44" stroke="var(--accent)" strokeWidth="1.2" opacity="0.9" />
        <ellipse cx="50" cy="46" rx="30" ry="36" stroke="rgba(255,255,255,.18)" strokeWidth="0.6" />
        {[26, 38, 50, 62, 74].map((x) => (
          <line key={x} x1={x} y1="14" x2={x} y2="80" stroke="rgba(255,255,255,.14)" strokeWidth="0.5" />
        ))}
        {[24, 36, 48, 60, 72].map((y) => (
          <line key={y} x1="14" y1={y} x2="86" y2={y} stroke="rgba(255,255,255,.14)" strokeWidth="0.5" />
        ))}
        <path d="M50 90 L50 150" stroke="var(--accent)" strokeWidth="1.4" />
        <path d="M42 90 L42 120 Q42 128 50 128 Q58 128 58 120 L58 90" stroke="rgba(255,255,255,.2)" strokeWidth="0.7" />
        <rect x="45" y="132" width="10" height="26" rx="3" stroke="rgba(255,255,255,.25)" strokeWidth="0.8" />
      </svg>
    </div>
  );
}
