"use client";
import React, { useEffect, useRef, useState } from "react";
import { config, questionList, EARLY_EXIT_AFTER_INDEX } from "../lib/config";
import { score, type Answers, type Result } from "../engine/score";
import { saveDraft, clearDraft, sendResponse, flushQueue, buildRow } from "../lib/persist";
import QuestionScreen from "./QuestionScreen";
import ResultScreen from "./ResultScreen";
import Intro from "./Intro";
import { ProgressBar } from "./ui";

type Phase = "intro" | "quiz" | "result";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);

  const total = questionList.length;
  const q = questionList[index];

  // latest snapshot for the abandon handler (avoids stale closures)
  const snap = useRef<{ answers: Answers; completed: boolean }>({ answers: {}, completed: false });
  snap.current.answers = answers;

  // retry any responses stranded offline on a previous visit
  useEffect(() => { flushQueue(); }, []);

  // persist a partial row if the user leaves mid-quiz (spec §4: partial answers still valuable)
  useEffect(() => {
    const onLeave = () => {
      const a = snap.current.answers;
      if (snap.current.completed) return;
      if (Object.keys(a).length === 0) return;
      snap.current.completed = true; // guard against double send
      sendResponse(buildRow(a, null, false));
    };
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onLeave();
    });
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  const setAnswer = (v: any) => {
    setAnswers((prev) => {
      const nextAnswers = { ...prev, [q.id]: v };
      saveDraft(nextAnswers); // localStorage every question — nothing lost offline
      return nextAnswers;
    });
  };

  const finish = () => {
    const r = score(answers, config);
    setResult(r);
    setPhase("result");
    snap.current.completed = true;
    sendResponse(buildRow(answers, r, true)); // INSERT completed row
    clearDraft();
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const next = () => {
    if (index >= total - 1) return finish();
    setIndex(index + 1);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };
  const prev = () => {
    if (index === 0) return setPhase("intro");
    setIndex(index - 1);
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setIndex(0);
    setPhase("intro");
    snap.current = { answers: {}, completed: false };
    clearDraft();
  };

  if (phase === "intro") return <Intro onStart={() => setPhase("quiz")} />;
  if (phase === "result" && result) return <ResultScreen result={result} onRestart={restart} />;

  const canEarlyExit = index > EARLY_EXIT_AFTER_INDEX; // Q12 onward
  const pct = ((index + 1) / total) * 100;

  return (
    <>
      {/* header chrome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prev} aria-label="上一題" style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", fontSize: 22, cursor: "pointer", padding: 0 }} className="archivo">
          ‹
        </button>
        <span style={{ fontFamily: "var(--font-noto)", fontWeight: 700, fontSize: 13, color: "var(--ink-dim)", letterSpacing: ".04em" }}>
          {q.section}
        </span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>
          {String(index + 1).padStart(2, "0")} / {total}
        </span>
      </div>
      <div style={{ marginBottom: canEarlyExit ? 14 : 34 }}>
        <ProgressBar pct={pct} />
      </div>

      {canEarlyExit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 26, padding: "10px 14px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, background: "rgba(255,255,255,.02)" }}>
          <span style={{ fontFamily: "var(--font-noto)", fontSize: 12.5, color: "var(--ink-dim)" }}>
            ✓ 已可產生結果 · 再答 {total - index} 題更懂你
          </span>
          <button onClick={finish} className="archivo" style={{ flex: "none", background: "none", border: "none", color: "var(--accent)", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            直接看結果 →
          </button>
        </div>
      )}

      <QuestionScreen
        key={q.id}
        question={q as any}
        value={answers[q.id]}
        onChange={setAnswer}
        onNext={next}
      />
    </>
  );
}
