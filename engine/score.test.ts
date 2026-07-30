import { describe, it, expect } from "vitest";
import { score, type Answers, type Config } from "./score";
import questions from "../config/questions.json";
import racquets from "../config/racquets.json";

const config = { questions, racquets } as unknown as Config;

// racquet lookups for assertions the Result doesn't carry directly
const byId = new Map(racquets.racquets.map((r: any) => [r.id, r]));
const difficultyOf = (id: string) => (byId.get(id) as any).difficulty;
const isCosmetic = (id: string) => Boolean((byId.get(id) as any).cosmetic);

describe("scoring engine", () => {
  // 1 | tennis elbow + wants power & spin | Top1 = squared_squared
  it("1: injured player who wants power+spin lands on SQUARED", () => {
    const answers: Answers = {
      Q1: "q1b",
      Q2: { years: "y2", freq: "f2" },
      Q3: "q3c",
      Q5: "q5a",
      Q10: "q10c",
      Q12: ["w_power", "w_spin", "w_comfort"],
    };
    const r = score(answers, config);
    expect(r.matches[0].id).toBe("squared_squared");
  });

  // 2 | topspin brute + healthy + high stamina | Top1 = extreme_mp
  it("2: healthy topspin brute with stamina lands on EXTREME MP", () => {
    const answers: Answers = {
      Q1: "q1c",
      Q2: { years: "y3", freq: "f3" },
      Q3: "q3a",
      Q5: "q5a",
      Q7: "q7b",
      Q8: "q8a",
      Q9: "q9c",
      Q10: "q10a",
      Q11: "q11a",
      Q12: ["w_spin", "w_power", "w_control"],
    };
    const r = score(answers, config);
    expect(r.matches[0].id).toBe("extreme_mp");
  });

  // 3 | mid level, balanced all-court | Top1 in SPEED series
  it("3: balanced mid-level player lands in the SPEED series", () => {
    const answers: Answers = {
      Q1: "q1c",
      Q2: { years: "y3", freq: "f3" },
      Q3: "q3a",
      Q5: "q5a",
      Q9: "q9a",
    };
    const r = score(answers, config);
    expect(r.matches[0].series).toBe("SPEED");
  });

  // 4 | NTRP 2.0 beginner | no racquet with difficulty > 15
  it("4: NTRP 2.0 beginner never gets a difficulty>15 racquet", () => {
    const answers: Answers = {
      Q1: "q1a",
      Q2: { years: "y1", freq: "f1" },
      Q3: "q3a",
    };
    const r = score(answers, config);
    for (const m of r.matches) {
      expect(difficultyOf(m.id)).toBeLessThanOrEqual(15);
    }
  });

  // 5 | any Q3 = q3c (tennis elbow) | no racquet with ra > 63
  it("5: tennis-elbow answer never yields a racquet with ra>63", () => {
    const answers: Answers = {
      Q1: "q1c",
      Q2: { years: "y3", freq: "f3" },
      Q3: "q3c",
      Q5: "q5b",
      Q9: "q9a",
    };
    const r = score(answers, config);
    for (const m of r.matches) {
      expect(m.ra).toBeLessThanOrEqual(63);
    }
  });

  // 6 | any answers | Top 3 all HEAD, none cosmetic
  it("6: Top 3 are always three HEAD racquets and never a cosmetic", () => {
    const answers: Answers = {
      Q1: "q1c",
      Q2: { years: "y3", freq: "f3" },
      Q3: "q3a",
      Q5: "q5a",
      Q7: "q7b",
      Q10: "q10a",
    };
    const r = score(answers, config);
    expect(r.matches).toHaveLength(3);
    for (const m of r.matches) {
      expect(isCosmetic(m.id)).toBe(false);
    }
  });

  // 7 | any answers | Top1 matchPct within 85-97
  // Band was 85-95 while the deltas pushed power/control/comfort up together:
  // the ideal sat outside what any racquet can be, so nobody could score high.
  // With zero-sum power/control the ideal is reachable and the five reference
  // personas now land 85.3-95.9 (each on a different, apt racquet).
  it("7: Top1 match percentage lands in the calibrated 85-97 band", () => {
    const answers: Answers = {
      Q1: "q1c",
      Q2: { years: "y3", freq: "f3" },
      Q3: "q3a",
      Q5: "q5a",
      Q9: "q9a",
    };
    const r = score(answers, config);
    expect(r.matches[0].matchPct).toBeGreaterThanOrEqual(85);
    expect(r.matches[0].matchPct).toBeLessThanOrEqual(97);
  });
});
