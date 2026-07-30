"use client";
import React, { useEffect, useRef, useState } from "react";
import { config, questionList, EARLY_EXIT_AFTER_INDEX } from "../lib/config";
import { score, type Answers, type Result } from "../engine/score";
import { saveDraft, clearDraft, sendResponse, flushQueue, buildRow, type Business } from "../lib/persist";
import QuestionScreen from "./QuestionScreen";
import ResultScreen from "./ResultScreen";
import BusinessForm from "./BusinessForm";
import Intro from "./Intro";
import { ProgressBar } from "./ui";

type Phase = "intro" | "quiz" | "business" | "result";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);
  const [nickname, setNickname] = useState("");

  const total = questionList.length;
  const q = questionList[index];

  // latest snapshot for the abandon handler (avoids stale closures).
  // sent = the DB row for this session has already gone out (guards double-insert).
  const snap = useRef<{ answers: Answers; result: Result | null; sent: boolean }>({
    answers: {},
    result: null,
    sent: false,
  });
  snap.current.answers = answers;

  // retry any responses stranded offline on a previous visit
  useEffect(() => { flushQueue(); }, []);

  // If the user leaves before the (optional) business form is submitted, still
  // persist what we have: a completed row if they reached the result, else a
  // partial row (spec §4: partial answers are valuable too).
  useEffect(() => {
    const onLeave = () => {
      if (snap.current.sent) return;
      const a = snap.current.answers;
      if (Object.keys(a).length === 0) return;
      snap.current.sent = true;
      const r = snap.current.result;
      sendResponse(buildRow(a, r, r !== null));
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

  // end of quiz -> compute result, then ask the optional business step before showing it
  const finish = () => {
    const r = score(answers, config);
    setResult(r);
    snap.current.answers = answers;
    snap.current.result = r; // hold result so the abandon handler can still persist it
    clearDraft();
    setPhase("business");
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // business form submitted OR skipped: one INSERT with everything, then reveal result
  const submitBusiness = (b: Business) => {
    if (!snap.current.sent) {
      snap.current.sent = true;
      sendResponse(buildRow(answers, result ?? snap.current.result, true, b));
    }
    setNickname((b.nickname ?? "").trim());
    setPhase("result");
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
    setNickname("");
    snap.current = { answers: {}, result: null, sent: false };
    clearDraft();
  };

  if (phase === "intro") return <Intro onStart={() => setPhase("quiz")} />;
  if (phase === "business") return <BusinessForm onSubmit={submitBusiness} />;
  if (phase === "result" && result)
    return (
      <ResultScreen
        result={result}
        answers={answers}
        nickname={nickname}
        onRestart={restart}
      />
    );

  const canEarlyExit = index > EARLY_EXIT_AFTER_INDEX; // Q12 onward
  const pct = ((index + 1) / total) * 100;

  return (
    <>
      {/* header chrome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {/* .icon-btn gives this a 44px target — the bare glyph was 8×24 */}
        <button onClick={prev} aria-label="上一題" className="archivo icon-btn" style={{ fontSize: 22, marginLeft: -10 }}>
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
        <ProgressBar pct={pct} label="測驗進度" now={index + 1} total={total} />
      </div>

      {canEarlyExit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 26, padding: "10px 14px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, background: "rgba(255,255,255,.02)" }}>
          <span style={{ fontFamily: "var(--font-noto)", fontSize: 12.5, color: "var(--ink-dim)" }}>
            ✓ 已可產生結果 · 再答 {total - index} 題更懂你
          </span>
          <button onClick={finish} className="archivo text-btn" style={{ flex: "none", color: "var(--accent)", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
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
