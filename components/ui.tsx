"use client";
import React, { useState } from "react";

export const ACCENT = "var(--accent)";

const IMG_EXTS = ["webp", "png", "jpg"];

/**
 * Real racquet photo with graceful fallback.
 * One image per series: `public/racquets/<series>.<ext>` (boom.webp, speed.png, …),
 * cover art `public/racquets/_cover.<ext>`. Best results with a transparent-background
 * cutout (racquet only, no text). Missing file -> wireframe placeholder.
 * Tries webp -> png -> jpg -> placeholder.
 */
export function RacquetImage({
  name,
  size = 200,
  ratio = 1.62,
  alt,
}: {
  name: string; // series slug (lowercase) or "_cover"
  size?: number;
  ratio?: number;
  alt?: string;
}) {
  const [attempt, setAttempt] = useState(0);
  if (attempt >= IMG_EXTS.length) return <RacquetPlaceholder size={size} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/racquets/${name.toLowerCase()}.${IMG_EXTS[attempt]}`}
      alt={alt ?? `HEAD ${name} 系列球拍`}
      onError={() => setAttempt((a) => a + 1)}
      style={{ width: size, height: size * ratio, objectFit: "contain", display: "block" }}
    />
  );
}

/** Page shell: dark bg + subtle dotted grid, content centered mobile-first. */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="main"
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

export function ProgressBar({
  pct,
  label,
  now,
  total,
}: {
  pct: number;
  label?: string;
  now?: number;
  total?: number;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={now}
      aria-valuetext={now && total ? `第 ${now} 題,共 ${total} 題` : undefined}
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
      // surface + hover/active/disabled live in .btn-primary (globals.css)
      className={`archivo btn-primary${pulse ? " pulse" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        height: 56,
        border: "none",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: ".02em",
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
      className="btn-ghost"
      style={{
        width: "100%",
        height: 46,
        borderRadius: 12,
        fontFamily: "var(--font-noto), sans-serif",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Selectable card: outline when idle, filled + glow when selected.
 * Spread onto the button — `{...optionCard(sel)}`. Surface colors come from the
 * .opt / .opt-on classes so :hover and :active can actually take effect; an
 * inline `background` would outrank them.
 */
export function optionCard(
  selected: boolean,
  styleOverride?: React.CSSProperties
): { className: string; style: React.CSSProperties } {
  return {
    className: `opt${selected ? " opt-on" : ""}`,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      width: "100%",
      padding: "15px 17px",
      borderRadius: 12,
      cursor: "pointer",
      textAlign: "left",
      ...styleOverride,
    },
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
