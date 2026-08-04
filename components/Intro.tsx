"use client";
import React from "react";
import { PrimaryButton } from "./ui";
import Racquet3D from "./Racquet3D";
import { LINKS, hasWebsite } from "../lib/links";

export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, animation: "screenIn .3s ease both" }}>
      <div className="mono" style={{ fontWeight: 600, fontSize: 11, letterSpacing: ".24em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
        HEAD · 官方選拍工具
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
        <Racquet3D width={212} height={344} />
        <div className="mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "rgba(255,255,255,.28)", marginTop: 2 }}>
          拖曳旋轉 · DRAG TO ROTATE
        </div>
      </div>

      {/* headline owns the most air; the line below it stays tight to the CTA
          so the page reads as two beats, not five evenly spaced ones */}
      <h1 className="archivo" style={{ fontWeight: 900, fontSize: "clamp(40px,13vw,46px)", lineHeight: 1.04, letterSpacing: "-.02em", color: "#fff", margin: "0 0 14px" }}>
        找到你的<br />本命球拍
      </h1>
      <p style={{ fontFamily: "var(--font-noto)", fontSize: 15, lineHeight: 1.6, color: "var(--ink-dim)", margin: "0 0 20px", maxWidth: 320 }}>
        回答 15 題,演算法為你比對 HEAD 全系列規格,精準命中真正適合你的那一支。
      </p>

      <PrimaryButton pulse onClick={onStart}>
        開始測驗 <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>

      {/* one inline meta line instead of three equal boxed chips */}
      <div className="mono" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 9, marginTop: 16, fontSize: 11, letterSpacing: ".08em", color: "var(--ink-faint)" }}>
        {["約 2–3 分鐘", "免註冊", "HEAD 官方"].map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <span aria-hidden style={{ color: "var(--accent)", opacity: 0.75 }}>/</span>}
            <span>{t}</span>
          </React.Fragment>
        ))}
        {hasWebsite() && (
          <a href={LINKS.website} target="_blank" rel="noopener noreferrer" className="link-quiet" style={{ marginLeft: "auto", letterSpacing: ".08em" }}>
            HEAD 官網 →
          </a>
        )}
      </div>
    </div>
  );
}
