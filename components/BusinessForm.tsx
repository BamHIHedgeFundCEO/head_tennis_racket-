"use client";
import React, { useState } from "react";
import type { Business } from "../lib/persist";
import { optionCardStyle } from "./ui";

const GENDERS = ["男", "女", "不想說"];
const AGES = ["18 以下", "18–24", "25–34", "35–44", "45–54", "55+"];

/**
 * 選填業務欄位（spec §3.5：結果頁「之後」才問）。
 * ⚠️ 性別只存 DB，絕不進 score()。暱稱用於顯示 + 成績卡。
 */
export default function BusinessForm({
  onSubmit,
}: {
  onSubmit: (b: Business) => void;
}) {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (b: Business) => {
    onSubmit(b);
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ marginTop: 24, padding: "16px 16px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, background: "rgba(255,255,255,.02)" }}>
        <span className="mono" style={{ fontSize: 12, letterSpacing: ".1em", color: "var(--accent)" }}>
          ✓ 已送出 · 謝謝
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, padding: "18px 16px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, background: "rgba(255,255,255,.02)" }}>
      <div className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: "var(--ink-faint)", marginBottom: 4 }}>
        （選填）留下資料 · MORE FOR YOU
      </div>
      <div style={{ fontFamily: "var(--font-noto)", fontSize: 12.5, color: "var(--ink-dim)", marginBottom: 16 }}>
        想順便看穿搭建議、拿完整報告嗎？留一下，我們用得上。
      </div>

      <label style={{ ...labelStyle }}>暱稱</label>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="怎麼稱呼你？"
        maxLength={20}
        style={inputStyle}
      />

      <label style={{ ...labelStyle, marginTop: 16 }}>性別</label>
      <div style={{ display: "flex", gap: 8 }}>
        {GENDERS.map((g) => {
          const sel = gender === g;
          return (
            <button key={g} onClick={() => setGender(sel ? null : g)} style={{ ...optionCardStyle(sel), padding: "10px 0", justifyContent: "center", flex: 1 }}>
              <span className="archivo" style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 13 }}>{g}</span>
            </button>
          );
        })}
      </div>

      <label style={{ ...labelStyle, marginTop: 16 }}>年齡層</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {AGES.map((a) => {
          const sel = age === a;
          return (
            <button key={a} onClick={() => setAge(sel ? null : a)} style={{ ...optionCardStyle(sel), padding: "8px 14px", justifyContent: "center", width: "auto", flex: "none" }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{a}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => submit({ nickname, gender, age_band: age })}
        className="archivo"
        style={{ marginTop: 18, width: "100%", height: 50, border: "none", borderRadius: 12, background: "var(--accent)", color: "#141414", fontWeight: 800, fontSize: 15, cursor: "pointer" }}
      >
        送出
      </button>
      <button
        onClick={() => submit({})}
        style={{ marginTop: 10, width: "100%", height: 40, background: "transparent", border: "none", color: "var(--ink-faint)", fontFamily: "var(--font-noto)", fontSize: 13, cursor: "pointer" }}
      >
        略過
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
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  borderRadius: 10,
  background: "rgba(255,255,255,.02)",
  border: "1px solid var(--hairline)",
  color: "#fff",
  fontSize: 15,
  outline: "none",
};
