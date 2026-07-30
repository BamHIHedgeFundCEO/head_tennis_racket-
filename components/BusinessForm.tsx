"use client";
import React, { useState } from "react";
import type { Business } from "../lib/persist";
import { optionCard, PrimaryButton } from "./ui";

const GENDERS = ["男", "女", "不想說"];

/**
 * 選填業務欄位 —— 問卷最後一步（結果之前），提高填答率。
 * ⚠️ 性別只存 DB，絕不進 score()。暱稱用於結果頁招呼 + 成績卡。
 */
export default function BusinessForm({
  onSubmit,
}: {
  onSubmit: (b: Business) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, animation: "screenIn .28s ease both" }}>
      <div className="mono" style={{ fontWeight: 600, fontSize: 11, letterSpacing: ".2em", color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: 14 }}>
        最後一步 · ALMOST THERE
      </div>
      <h2 className="archivo" style={{ fontWeight: 800, fontSize: "clamp(24px,7vw,29px)", lineHeight: 1.22, letterSpacing: "-.01em", color: "#fff", margin: "0 0 10px" }}>
        怎麼稱呼你？
      </h2>
      <p style={{ fontFamily: "var(--font-noto)", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-dim)", margin: "0 0 26px" }}>
        （都可略過）留個暱稱，結果頁和成績卡會更有你的味道。
      </p>

      <label style={labelStyle} htmlFor="nickname">暱稱</label>
      <input
        id="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="輸入你的暱稱"
        maxLength={20}
        className="field"
        style={inputStyle}
      />

      <label style={{ ...labelStyle, marginTop: 22 }}>性別（不進推薦計算，只做市場統計）</label>
      <div style={{ display: "flex", gap: 8 }}>
        {GENDERS.map((g) => {
          const sel = gender === g;
          return (
            <button key={g} onClick={() => setGender(sel ? null : g)} {...optionCard(sel, { padding: "12px 0", justifyContent: "center", flex: 1 })}>
              <span className="archivo" style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 14 }}>{g}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 24 }} />
      <PrimaryButton pulse onClick={() => onSubmit({ nickname, gender })}>
        看結果 <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>
      <button
        onClick={() => onSubmit({})}
        className="text-btn"
        style={{ marginTop: 12, width: "100%", height: 44, color: "var(--ink-faint)", fontFamily: "var(--font-noto)", fontSize: 13 }}
      >
        略過，直接看結果
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-noto)",
  fontWeight: 700,
  fontSize: 12.5,
  color: "var(--ink-dim)",
  marginBottom: 8,
};
// surface/border/focus come from .field (globals.css) — keep this layout-only
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 50,
  padding: "0 16px",
  borderRadius: 10,
  fontSize: 16,
};
