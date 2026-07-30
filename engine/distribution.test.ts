/**
 * Recommendation-spread guard.
 *
 * The engine used to hand SQUARED to 40% of all answer sets: every question's
 * deltas pushed power, control and comfort up together, so the "ideal" saturated
 * at a corner no racquet can reach (power + control is fixed near 101 by the
 * vector formula) and ranking collapsed onto whichever racquet sat closest to
 * the fleet centroid. The fix was in the config — power/control deltas are now
 * zero-sum and comfort deltas are clipped at zero after de-meaning.
 *
 * This test samples the answer space and fails if any single racquet starts
 * dominating again. It is a smoke alarm, not a spec: if a deliberate config
 * change moves these numbers, re-run and update the thresholds with intent.
 */
import { describe, expect, it } from "vitest";
import { config, questionList } from "../lib/config";
import { score, type Answers } from "./score";

function rnd(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

function randomAnswers(r: () => number): Answers {
  const a: Answers = {};
  for (const q of questionList as any[]) {
    if (q.type === "single") {
      a[q.id] = q.options[Math.floor(r() * q.options.length)].id;
    } else if (q.type === "dual_select") {
      const o: Record<string, string> = {};
      for (const f of q.fields) o[f.id] = f.options[Math.floor(r() * f.options.length)].id;
      a[q.id] = o;
    } else if (q.type === "composite") {
      const o: Record<string, string | string[]> = {};
      for (const f of q.fields) {
        if (f.type === "multi") {
          const pool = [...f.options];
          const picked: string[] = [];
          const n = 1 + Math.floor(r() * (f.max ?? 2));
          for (let i = 0; i < n && pool.length; i++) {
            picked.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
          }
          o[f.id] = picked;
        } else o[f.id] = "";
      }
      a[q.id] = o;
    } else if (q.type === "ranked_pick") {
      const pool = [...q.options];
      const picked: string[] = [];
      for (let i = 0; i < (q.pick ?? 3) && pool.length; i++) {
        picked.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
      }
      a[q.id] = picked;
    }
  }
  return a;
}

describe("recommendation spread", () => {
  const N = 3000;
  const fleet = config.racquets.racquets.filter((x: any) => !x.cosmetic);

  const r = rnd(11);
  const top1: Record<string, number> = {};
  const ideal: Record<string, number[]> = { power: [], control: [], spin: [], comfort: [] };
  for (let i = 0; i < N; i++) {
    const res = score(randomAnswers(r), config);
    for (const a of Object.keys(ideal)) ideal[a].push(res.userIdeal[a]);
    const w = res.matches[0];
    if (w) top1[w.id] = (top1[w.id] ?? 0) + 1;
  }
  const sorted = Object.entries(top1).sort((a, b) => b[1] - a[1]);
  const shares = sorted.map(([, v]) => v / N);

  it("no single racquet dominates the answer space", () => {
    const [id, count] = sorted[0];
    const share = count / N;
    // sits at ~16.5% today; 0.25 leaves headroom without letting a regression hide
    expect(share, `${id} wins ${(share * 100).toFixed(1)}% of random answer sets`).toBeLessThan(0.25);
  });

  it("most of the range stays reachable", () => {
    expect(sorted.length, "racquets that win at least once").toBeGreaterThanOrEqual(20);
  });

  it("the ideal stays inside the range real racquets occupy", () => {
    // power + control is ~101 for every racquet; an ideal far outside that band
    // means the deltas have drifted back to pushing both axes the same way.
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const pc = mean(ideal.power) + mean(ideal.control);
    expect(pc, `mean ideal power+control = ${pc.toFixed(1)}`).toBeGreaterThan(80);
    expect(pc).toBeLessThan(125);
  });

  it("comfort still discriminates between users", () => {
    const xs = ideal.comfort;
    const m = xs.reduce((s, x) => s + x, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length);
    expect(sd, `comfort sd = ${sd.toFixed(1)}`).toBeGreaterThan(8);
  });
});
