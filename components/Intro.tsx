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

      <h1 className="archivo" style={{ fontWeight: 900, fontSize: "clamp(40px,13vw,46px)", lineHeight: 1.04, letterSpacing: "-.02em", color: "#fff", margin: "0 0 16px" }}>
        找到你的<br />本命球拍
      </h1>
      <p style={{ fontFamily: "var(--font-noto)", fontSize: 15, lineHeight: 1.6, color: "var(--ink-dim)", margin: "0 0 26px", maxWidth: 320 }}>
        回答 15 題,演算法為你比對 HEAD 全系列規格,精準命中真正適合你的那一支。
      </p>

      <PrimaryButton pulse onClick={onStart}>
        開始測驗 <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {["約 2–3 分鐘", "免註冊", "HEAD 官方"].map((t) => (
          <span key={t} className="mono" style={{ flex: 1, textAlign: "center", padding: "9px 0", border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, fontSize: 11, color: "var(--ink-dim)" }}>
            {t}
          </span>
        ))}
      </div>
      {hasWebsite() && (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <a href={LINKS.website} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--ink-faint)" }}>
            前往 HEAD 官網 →
          </a>
        </div>
      )}
    </div>
  );
}
