import questions from "../config/questions.json";
import racquets from "../config/racquets.json";
import type { Config } from "../engine/score";

export const config = { questions, racquets } as unknown as Config;

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
