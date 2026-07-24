"use client";
import React, { useState } from "react";
import type { Result, Answers } from "../engine/score";
import type { Business } from "../lib/persist";
import BusinessForm from "./BusinessForm";
import {
  heroTags,
  whyThis,
  whyNot,
  guessReveal,
  otherOptions,
  racquetName,
  courtPersona,
} from "../lib/copy";
import { PrimaryButton, GhostButton, RacquetImage, monoLabel } from "./ui";

export default function ResultScreen({
  result,
  answers,
  onRestart,
  onSubmitBusiness,
}: {
  result: Result;
  answers?: Answers;
  onRestart: () => void;
  onSubmitBusiness?: (b: Business) => void;
}) {
  const [nickname, setNickname] = useState("");
  const top = result.matches[0];
  if (!top) return null;
  const pct = Math.round(top.matchPct);
  const tags = heroTags(result);
  const bullets = whyThis(result);
  const runner = whyNot(result);
  const guess = guessReveal(result);
  const others = otherOptions(result);
  const persona = courtPersona(answers);

  const AXIS_EN: Record<string, string> = { power: "POWER", control: "CONTROL", spin: "SPIN", comfort: "COMFORT" };
  const ogTags = Object.keys(top.vector)
    .sort((a, b) => top.vector[b] - top.vector[a])
    .slice(0, 3)
    .map((a) => AXIS_EN[a] ?? a.toUpperCase());
  const shareUrl =
    `/api/og?series=${encodeURIComponent(top.series)}` +
    `&model=${encodeURIComponent(top.model)}` +
    `&pct=${pct}` +
    `&t=${encodeURIComponent(ogTags.join(","))}`;
  const openShare = () => {
    if (typeof window !== "undefined") window.open(shareUrl, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", animation: "screenIn .3s ease both", paddingBottom: 8 }}>
      <div style={{ ...monoLabel, color: "var(--accent)", marginBottom: 14, animation: "matchIn .5s ease both" }}>
        診斷完成 · MATCH FOUND
      </div>

      {/* ① HERO */}
      <div style={{ fontFamily: "var(--font-noto)", fontWeight: 500, fontSize: 13, color: "var(--ink-dim)", letterSpacing: ".06em" }}>
        {nickname ? `${nickname}，你的本命球拍` : "你的本命球拍"}
      </div>
      <div className="archivo" style={{ fontWeight: 800, fontSize: "clamp(26px,8vw,32px)", letterSpacing: "-.01em", color: "#fff", margin: "2px 0 18px" }}>
        {racquetName(top.id)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, animation: "matchIn .6s ease both" }}>
        <div style={{ flex: "none", marginLeft: -6 }}>
          <RacquetImage id={top.id} size={128} />
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ display: "inline-flex", alignItems: "flex-start", color: "var(--accent)", textShadow: "0 0 40px var(--glow-strong)" }}>
            <span className="archivo mono" style={{ fontWeight: 900, fontSize: "clamp(78px,24vw,98px)", lineHeight: 0.86, letterSpacing: "-.04em" }}>
              {pct}
            </span>
            <span className="archivo" style={{ fontWeight: 800, fontSize: 36, marginTop: 8 }}>%</span>
          </div>
          <div className="mono" style={{ fontWeight: 600, fontSize: 10, letterSpacing: ".24em", color: "var(--ink-faint)", marginTop: 2 }}>
            匹配度 · MATCH SCORE
          </div>
        </div>
      </div>

      <div style={{ height: 4, width: "100%", background: "rgba(255,255,255,.1)", borderRadius: 2, overflow: "hidden", margin: "16px 0 20px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", boxShadow: "0 0 12px var(--glow)" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {tags.map((t, i) => (
          <span
            key={t}
            className="archivo"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px 0",
              borderRadius: 8,
              fontFamily: "var(--font-noto)",
              fontWeight: 700,
              fontSize: 12.5,
              background: i === 0 ? "var(--accent)" : "transparent",
              color: i === 0 ? "#141414" : "rgba(255,255,255,.75)",
              border: i === 0 ? "none" : "1px solid rgba(255,255,255,.18)",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* ② WHY THIS */}
      <SectionLabel>推薦理由 / WHY THIS</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 6 }}>
        {bullets.map((b, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "14px 0",
              borderBottom: i < bullets.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
            }}
          >
            <span style={{ flex: "none", width: 6, height: 6, background: "var(--accent)", borderRadius: 1, marginTop: 6 }} />
            <span style={{ fontFamily: "var(--font-noto)", fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,.8)" }}>{b}</span>
          </div>
        ))}
      </div>

      {/* ③ WHY NOT — killer block */}
      {runner && (
        <Card style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: "var(--ink-faint)" }}>
              為什麼不是 · RUNNER-UP
            </span>
            <span className="archivo mono" style={{ fontWeight: 900, fontSize: 15, color: "rgba(255,255,255,.5)" }}>{runner.pct}%</span>
          </div>
          <div className="archivo" style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>
            {runner.name}
          </div>
          <div style={{ fontFamily: "var(--font-noto)", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-dim)" }}>
            {runner.reason}
          </div>
        </Card>
      )}

      {/* ④ GUT-CHECK reveal (Q15) */}
      {guess && (
        <Card style={{ marginTop: 14, borderColor: guess.correct ? "rgba(255,255,255,.1)" : "var(--accent)" }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: "var(--ink-faint)" }}>
            直覺 vs 真實 · GUT CHECK
          </span>
          <div style={{ fontFamily: "var(--font-noto)", fontSize: 14, lineHeight: 1.55, color: "#fff", marginTop: 8 }}>
            {guess.text}
          </div>
        </Card>
      )}

      {/* MBTI 球場人格（flavor / 語氣層） */}
      {persona && (
        <Card style={{ marginTop: 14 }}>
          <span className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: "var(--ink-faint)" }}>
            球場人格 · YOUR COURT PERSONA
          </span>
          <div className="archivo" style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 15, color: "#fff", margin: "8px 0 4px" }}>
            {persona.title}
          </div>
          <div style={{ fontFamily: "var(--font-noto)", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-dim)", marginBottom: 12 }}>
            {persona.blurb}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {persona.personas.map((p) => (
              <div key={p.type} style={{ display: "flex", gap: 12 }}>
                <span className="mono" style={{ flex: "none", width: 46, fontWeight: 700, fontSize: 12, color: "var(--accent)", paddingTop: 2 }}>
                  {p.type}
                </span>
                <span>
                  <span style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 13.5, color: "#fff" }}>
                    {p.nickname} · {p.role}
                  </span>
                  <span style={{ display: "block", fontFamily: "var(--font-noto)", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-dim)", marginTop: 3 }}>
                    {p.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ⑤ OTHER HEAD OPTIONS */}
      {others.length > 0 && (
        <>
          <SectionLabel style={{ marginTop: 26 }}>其他 HEAD 選擇 / ALSO CONSIDER</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {others.map((o) => (
              <Card key={o.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span className="archivo" style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 15, color: "#fff" }}>{o.name}</span>
                  <span className="archivo mono" style={{ fontWeight: 900, fontSize: 15, color: "var(--ink-dim)" }}>{o.pct}%</span>
                </div>
                <span style={{ fontFamily: "var(--font-noto)", fontSize: 12, color: "var(--ink-dim)" }}>{o.tag}</span>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 業務欄位（選填，結果之後才問） */}
      <BusinessForm
        onSubmit={(b) => {
          setNickname((b.nickname ?? "").trim());
          onSubmitBusiness?.(b);
        }}
      />

      {/* ⑥ SHARE + LINE */}
      <PrimaryButton pulse style={{ marginTop: 26 }} onClick={openShare}>
        分享成績卡 <span className="mono" style={{ fontWeight: 700 }}>↗</span>
      </PrimaryButton>
      <div style={{ marginTop: 10 }}>
        <GhostButton onClick={() => alert("加 LINE 領完整報告(建置步驟 4/6)")}>加 LINE 領完整報告</GhostButton>
      </div>
      <div style={{ marginTop: 10 }}>
        <GhostButton onClick={onRestart}>重新測驗</GhostButton>
      </div>
    </div>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="mono" style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".18em", color: "var(--ink-faint)", marginBottom: 6, ...style }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: "16px 16px 14px",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 12,
        background: "rgba(255,255,255,.02)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
