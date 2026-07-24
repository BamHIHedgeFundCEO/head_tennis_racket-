import type { Answers, Result } from "../engine/score";
import { config, questionList } from "./config";
import { supabase } from "./supabase";

const CONFIG_VERSION = (config.racquets as any).meta.version as string;
const DRAFT_KEY = "head_finder_draft";
const QUEUE_KEY = "head_finder_pending"; // rows that failed to reach Supabase

type Row = {
  answers: Answers;
  result: Result | null;
  ntrp_claimed: number | null;
  ntrp_inferred: number | null;
  current_racquet: string | null;
  nickname: string | null;
  gender: string | null;
  age_band: string | null;
  completed: boolean;
  config_version: string;
};

export type Business = { nickname?: string | null; gender?: string | null; age_band?: string | null };

function q1ClaimedNtrp(answers: Answers): number | null {
  const q1 = questionList.find((q) => q.id === "Q1");
  const picked = answers["Q1"];
  const opt = q1?.options?.find((o: any) => o.id === picked);
  return typeof opt?.ntrp === "number" ? opt.ntrp : null;
}

function currentRacquet(answers: Answers): string | null {
  const q4 = answers["Q4"] as any;
  const c = q4?.current;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

export function buildRow(
  answers: Answers,
  result: Result | null,
  completed: boolean,
  business?: Business
): Row {
  const nn = business?.nickname?.trim();
  return {
    answers,
    result,
    ntrp_claimed: q1ClaimedNtrp(answers),
    ntrp_inferred: result ? result.effectiveNtrp : null,
    current_racquet: currentRacquet(answers),
    nickname: nn ? nn : null,
    gender: business?.gender ?? null, // ⚠️ business only — never enters score()
    age_band: business?.age_band ?? null,
    completed,
    config_version: CONFIG_VERSION,
  };
}

/** Persist the in-progress draft locally every question. Nothing is lost offline. */
export function saveDraft(answers: Answers) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, ts: Date.now() }));
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

function queueRow(row: Row) {
  if (typeof window === "undefined") return;
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    q.push(row);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {}
}

async function insertRow(row: Row): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("responses").insert(row as any);
  return !error;
}

/** INSERT one row; on failure (offline / no client) stash it for a later retry. */
export async function sendResponse(row: Row): Promise<void> {
  const ok = await insertRow(row);
  if (!ok) queueRow(row);
}

/** Retry any rows that failed to send earlier (call on app load). */
export async function flushQueue(): Promise<void> {
  if (typeof window === "undefined" || !supabase) return;
  let q: Row[];
  try {
    q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return;
  }
  if (!q.length) return;
  const remaining: Row[] = [];
  for (const row of q) {
    const ok = await insertRow(row);
    if (!ok) remaining.push(row);
  }
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
}
