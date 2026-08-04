import questions from "../config/questions.json";
import racquets from "../config/racquets.json";
import type { Config } from "../engine/score";

export const config = { questions, racquets } as unknown as Config;

/**
 * Stamped onto every stored response.
 *
 * Both files change what a recommendation means, so both versions belong here:
 * racquets.json alone was recorded before, which meant the zero-sum delta
 * rework — a change that moved the whole distribution — left every row still
 * claiming the same version. Bump questions.json's meta.version whenever
 * scoring semantics change, so rows stay comparable within a version.
 */
export const CONFIG_VERSION = `q${(questions as any).meta.version}+r${(racquets as any).meta.version}`;

// convenience typed views for the UI (kept loose — the engine owns the real types)
export type QOption = Record<string, any>;
export type Question = {
  id: string;
  section: string;
  type: "single" | "dual_select" | "composite" | "ranked_pick";
  layer: string[];
  title: string;
  sublabel?: string;
  options?: QOption[];
  fields?: any[];
  pick?: number;
  rank_multipliers?: number[];
  [k: string]: any;
};

export const questionList = (questions as any).questions as Question[];
export const racquetList = (racquets as any).racquets as any[];
export const racquetById = new Map(racquetList.map((r) => [r.id, r]));

/** Index (0-based) after which the "you can already see results" early-exit unlocks. */
export const EARLY_EXIT_AFTER_INDEX = questionList.findIndex((q) => q.id === "Q11");
