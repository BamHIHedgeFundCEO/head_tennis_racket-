"use client";
import React, { useState } from "react";
import type { Question } from "../lib/config";
import {
  optionCardStyle,
  Radio,
  Check,
  PrimaryButton,
  monoLabel,
} from "./ui";

type Val = any;

const typeLabel: Record<string, string> = {
  single: "單選 SINGLE",
  dual_select: "雙欄 SELECT",
  composite: "複合 COMPOSITE",
  ranked_pick: "排序 RANK",
};

export default function QuestionScreen({
  question: q,
  value,
  onChange,
  onNext,
}: {
  question: Question;
  value: Val;
  onChange: (v: Val) => void;
  onNext: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, animation: "screenIn .28s ease both" }}>
      <div style={{ ...monoLabel, marginBottom: 14 }}>
        {q.id} · {typeLabel[q.type] ?? q.type}
      </div>
      <h2
        className="archivo"
        style={{
          fontWeight: 800,
          fontSize: "clamp(24px, 7vw, 29px)",
          lineHeight: 1.22,
          letterSpacing: "-.01em",
          color: "#fff",
          margin: "0 0 10px",
        }}
      >
        {q.title}
      </h2>
      {q.sublabel && (
        <p
          style={{
            fontFamily: "var(--font-noto), sans-serif",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--ink-dim)",
            margin: "0 0 26px",
          }}
        >
          {q.sublabel}
        </p>
      )}

      {q.type === "single" && (
        <SingleBody q={q} value={value} onChange={onChange} onNext={onNext} />
      )}
      {q.type === "dual_select" && (
        <DualBody q={q} value={value} onChange={onChange} onNext={onNext} />
      )}
      {q.type === "composite" && (
        <CompositeBody q={q} value={value} onChange={onChange} onNext={onNext} />
      )}
      {q.type === "ranked_pick" && (
        <RankedBody q={q} value={value} onChange={onChange} onNext={onNext} />
      )}
    </div>
  );
}

/* --------------------------------- single -------------------------------- */
function SingleBody({ q, value, onChange, onNext }: any) {
  const [pending, setPending] = useState<string | null>(null);
  const pick = (id: string) => {
    onChange(id);
    setPending(id);
    // brief feedback, then auto-advance (spec: single = one tap, no Next button)
    setTimeout(onNext, 180);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {q.options.map((o: any) => {
        const sel = (pending ?? value) === o.id;
        return (
          <button key={o.id} onClick={() => pick(o.id)} style={optionCardStyle(sel)}>
            <span>
              <span
                className="archivo"
                style={{ display: "block", fontWeight: 700, fontSize: 17, marginBottom: o.sublabel ? 4 : 0 }}
              >
                {o.label}
              </span>
              {o.sublabel && (
                <span style={{ display: "block", fontFamily: "var(--font-noto)", fontSize: 12.5, opacity: 0.6, lineHeight: 1.4 }}>
                  {o.sublabel}
                </span>
              )}
            </span>
            <Radio on={sel} />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- dual_select ------------------------------ */
function DualBody({ q, value, onChange, onNext }: any) {
  const v = value ?? {};
  const set = (fieldId: string, optId: string) => onChange({ ...v, [fieldId]: optId });
  const ready = q.fields.every((f: any) => v[f.id]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
      {q.fields.map((f: any) => (
        <div key={f.id}>
          <div style={{ ...monoLabel, marginBottom: 10 }}>{f.label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {f.options.map((o: any) => {
              const sel = v[f.id] === o.id;
              return (
                <button key={o.id} onClick={() => set(f.id, o.id)} style={optionCardStyle(sel)}>
                  <span className="archivo" style={{ fontWeight: 700, fontSize: 15 }}>{o.label}</span>
                  <Radio on={sel} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ flex: 1, minHeight: 8 }} />
      <PrimaryButton onClick={onNext} disabled={!ready}>
        下一題 <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>
    </div>
  );
}

/* -------------------------------- composite ------------------------------- */
function CompositeBody({ q, value, onChange, onNext }: any) {
  const v = value ?? { current: "", pain: [] };
  const currentField = q.fields.find((f: any) => f.type === "search_or_none");
  const painField = q.fields.find((f: any) => f.type === "multi");
  const max = painField?.max ?? 2;
  const [hint, setHint] = useState(false);

  const setCurrent = (s: string) => onChange({ ...v, current: s });
  const togglePain = (id: string) => {
    const arr: string[] = v.pain ?? [];
    if (arr.includes(id)) {
      onChange({ ...v, pain: arr.filter((x) => x !== id) });
      setHint(false);
    } else {
      if (arr.length >= max) { setHint(true); return; }
      onChange({ ...v, pain: [...arr, id] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
      <div>
        <div style={{ ...monoLabel, marginBottom: 10 }}>{currentField.label}</div>
        <input
          value={v.current ?? ""}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="輸入品牌/型號,或選下方"
          style={{
            width: "100%",
            height: 48,
            padding: "0 16px",
            borderRadius: 12,
            background: "rgba(255,255,255,.02)",
            border: "1px solid var(--hairline)",
            color: "#fff",
            fontSize: 15,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {currentField.options_extra.map((s: string) => {
            const sel = v.current === s;
            return (
              <button
                key={s}
                onClick={() => setCurrent(sel ? "" : s)}
                style={{
                  ...optionCardStyle(sel),
                  padding: "9px 14px",
                  justifyContent: "center",
                }}
              >
                <span className="archivo" style={{ fontWeight: 700, fontSize: 13 }}>{s}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={monoLabel}>{painField.label} · 最多 {max}</div>
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 7, padding: "4px 9px", fontWeight: 700 }}>
            {(v.pain?.length ?? 0)} / {max}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {painField.options.map((o: any) => {
            const sel = (v.pain ?? []).includes(o.id);
            return (
              <button key={o.id} onClick={() => togglePain(o.id)} style={optionCardStyle(sel)}>
                <span className="archivo" style={{ fontWeight: 700, fontSize: 15 }}>{o.label}</span>
                <Check on={sel} square />
              </button>
            );
          })}
        </div>
        {hint && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--accent)", fontFamily: "var(--font-noto)" }}>
            最多選 {max} 項,想換的話先取消一個。
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 8 }} />
      <PrimaryButton onClick={onNext}>
        下一題 <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>
    </div>
  );
}

/* ------------------------------- ranked_pick ------------------------------ */
const RANK_BADGE = ["1️⃣", "2️⃣", "3️⃣"];
function RankedBody({ q, value, onChange, onNext }: any) {
  const picks: string[] = value ?? [];
  const need = q.pick ?? 3;
  const toggle = (id: string) => {
    if (picks.includes(id)) {
      onChange(picks.filter((x) => x !== id));
    } else if (picks.length < need) {
      onChange([...picks, id]);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
      <div style={{ ...monoLabel, marginBottom: 2 }}>依序點選 · 前 {need} 名</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((o: any) => {
          const rank = picks.indexOf(o.id);
          const sel = rank >= 0;
          return (
            <button key={o.id} onClick={() => toggle(o.id)} style={optionCardStyle(sel)}>
              <span className="archivo" style={{ fontWeight: 700, fontSize: 16 }}>{o.label}</span>
              {sel ? (
                <span style={{ fontSize: 18 }}>{RANK_BADGE[rank]}</span>
              ) : (
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.6px solid currentColor", opacity: 0.5 }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 8 }} />
      <PrimaryButton onClick={onNext} disabled={picks.length < need}>
        {picks.length < need ? `再選 ${need - picks.length} 個` : "看結果"}{" "}
        <span className="mono" style={{ fontWeight: 700 }}>→</span>
      </PrimaryButton>
    </div>
  );
}
