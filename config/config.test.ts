/**
 * Config invariants.
 *
 * The engine is pure and well covered; every real bug so far has been in these
 * two JSON files, where the engine happily executes wrong input:
 *
 *   - deltas that pushed power, control and comfort up together, putting the
 *     ideal outside anything the racquet data can express
 *   - Q5 giving aggressive playstyles a positive power delta, contradicting Q7
 *   - sw_target_delta drifting negative, dragging the target below the fleet
 *
 * These assertions would have caught all three at commit time. They check
 * structure and sign conventions, not taste — a deliberate rebalance should
 * still pass.
 */
import { describe, expect, it } from "vitest";
import questions from "./questions.json";
import racquets from "./racquets.json";
import { TAG_BULLET_KEYS } from "../lib/copy";
import { Q13_OPTION_TO_TYPES, MBTI } from "../lib/mbti";

const qmeta = (questions as any).meta;
const qs = (questions as any).questions as any[];
const rs = (racquets as any).racquets as any[];
const AXES: string[] = qmeta.axes;

const NUDGE = new Set(qs.filter((q) => (q.layer ?? []).includes("nudge")).map((q) => q.id));

/** every option the engine can select, tagged with the question it came from */
function allOptions(opts?: { includeNudge?: boolean }) {
  const out: { qid: string; oid: string; label: string; opt: any }[] = [];
  for (const q of qs) {
    if (!opts?.includeNudge && NUDGE.has(q.id)) continue;
    const push = (list: any[] | undefined) => {
      for (const o of list ?? []) out.push({ qid: q.id, oid: o.id, label: o.label ?? "", opt: o });
    };
    push(q.options);
    for (const f of q.fields ?? []) push(f.options);
  }
  return out;
}

/** every delta object the engine folds into the ideal */
function engineDeltas() {
  const out: { qid: string; oid: string; key: string; d: Record<string, number> }[] = [];
  for (const { qid, oid, opt } of allOptions()) {
    for (const key of ["delta", "delta_advanced", "delta_beginner"]) {
      if (opt[key] && typeof opt[key] === "object") out.push({ qid, oid, key, d: opt[key] });
    }
  }
  return out;
}

describe("racquet data", () => {
  it("every racquet carries all four axes plus mass and head", () => {
    for (const r of rs) {
      for (const a of AXES) {
        expect(typeof r.vector?.[a], `${r.id}.vector.${a}`).toBe("number");
      }
      expect(typeof r.sw, `${r.id}.sw`).toBe("number");
      expect(typeof r.head, `${r.id}.head`).toBe("number");
      expect(typeof r.difficulty, `${r.id}.difficulty`).toBe("number");
    }
  });

  it("power and control stay on the band the vector formula produces", () => {
    // control is derived as ~(100 - power) + bonuses, so the pair is pinned.
    // The ideal is compared against these, which is why its deltas must be
    // zero-sum — see the delta tests below.
    for (const r of rs) {
      const pc = r.vector.power + r.vector.control;
      expect(pc, `${r.id} power+control=${pc}`).toBeGreaterThan(85);
      expect(pc, `${r.id} power+control=${pc}`).toBeLessThan(120);
    }
  });

  it("ids are unique and cosmetic entries point at a real racquet", () => {
    const ids = rs.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of rs.filter((x) => x.cosmetic)) {
      expect(ids, `${r.id}.inherits`).toContain(r.inherits);
    }
  });
});

describe("delta conventions", () => {
  it("power and control deltas are zero-sum", () => {
    // A push toward power must be an equal pull from control. One-directional
    // deltas drove the ideal to an unreachable corner and handed 40% of users
    // the racquet nearest the fleet centroid.
    for (const { qid, oid, key, d } of engineDeltas()) {
      const p = d.power ?? 0;
      const c = d.control ?? 0;
      expect(p + c, `${qid}.${oid}.${key} power${p >= 0 ? "+" : ""}${p} control${c >= 0 ? "+" : ""}${c}`).toBe(0);
    }
  });

  it("no axis drags every answer the same way", () => {
    // Each axis should be roughly balanced across the questionnaire. A large
    // one-directional sum means answering anything saturates that axis, which
    // costs the axis its ability to tell users apart.
    const sums: Record<string, number> = {};
    const mag: Record<string, number> = {};
    for (const { d } of engineDeltas()) {
      for (const a of AXES) {
        if (typeof d[a] !== "number") continue;
        sums[a] = (sums[a] ?? 0) + d[a];
        mag[a] = (mag[a] ?? 0) + Math.abs(d[a]);
      }
    }
    for (const a of AXES) {
      if (!mag[a]) continue;
      const bias = sums[a] / mag[a]; // -1 all negative, +1 all positive
      expect(Math.abs(bias), `${a}: net ${sums[a]} of ${mag[a]} total magnitude`).toBeLessThan(0.75);
    }
  });

  it("sw_target_delta is centred, so the level table decides the base", () => {
    const vals = allOptions()
      .filter(({ opt }) => typeof opt.sw_target_delta === "number" && typeof opt.ntrp !== "number")
      .map(({ opt }) => opt.sw_target_delta as number);
    const sum = vals.reduce((s, x) => s + x, 0);
    const mean = sum / vals.length;
    expect(Math.abs(mean), `mean sw_target_delta = ${mean.toFixed(2)} over ${vals.length} options`).toBeLessThan(2);
  });

  it("sw_target base rises with level and stays inside the real SW range", () => {
    const table = qmeta.sw_target_base_by_ntrp as Record<string, number>;
    const [lo, hi] = qmeta.scoring.calibrated.sw_clamp as [number, number];
    const sws = rs.filter((r) => !r.cosmetic).map((r) => r.sw);
    expect(lo).toBeGreaterThanOrEqual(Math.min(...sws) - 5);
    expect(hi).toBeLessThanOrEqual(Math.max(...sws) + 5);
    const keys = Object.keys(table).sort((a, b) => Number(a) - Number(b));
    for (let i = 1; i < keys.length; i++) {
      expect(table[keys[i]], `${keys[i]} vs ${keys[i - 1]}`).toBeGreaterThanOrEqual(table[keys[i - 1]]);
    }
    for (const k of keys) {
      expect(table[k], `sw_target_base_by_ntrp["${k}"]`).toBeGreaterThanOrEqual(lo);
      expect(table[k], `sw_target_base_by_ntrp["${k}"]`).toBeLessThanOrEqual(hi);
    }
  });
});

describe("references resolve", () => {
  it("every gate condition parses", () => {
    // evalCondition returns true for anything it cannot parse, so a typo here
    // becomes a gate that silently never blocks.
    const COND = /^([A-Za-z0-9_]+)\s*(>=|<=|==|>|<)\s*(.+)$/;
    const qById = new Map(qs.map((q) => [q.id, q]));
    for (const [series, spec] of Object.entries((qmeta.special_gates ?? {}) as Record<string, any>)) {
      for (const cond of spec.require_all as string[]) {
        const m = cond.match(COND);
        expect(m, `special_gates.${series}: "${cond}" does not parse`).not.toBeNull();
        const lhs = m![1];
        if (lhs === "effective_ntrp") continue;
        const q = qById.get(lhs);
        expect(q, `special_gates.${series}: "${cond}" references unknown question ${lhs}`).toBeDefined();
        const ids = (q!.options ?? []).map((o: any) => o.id);
        expect(ids, `special_gates.${series}: "${cond}" references unknown option`).toContain(m![3].trim());
      }
    }
  });

  it("every series named by a gate exists in the racquet data", () => {
    const seriesNames = new Set(rs.map((r) => r.series));
    for (const series of Object.keys(qmeta.special_gates ?? {})) {
      expect(seriesNames, `special_gates."${series}"`).toContain(series);
    }
    for (const { qid, oid, opt } of allOptions()) {
      for (const s of opt.gate?.exclude_series ?? []) {
        expect(seriesNames, `${qid}.${oid} gate.exclude_series`).toContain(s);
      }
      if (typeof opt.guess_series === "string") {
        expect(seriesNames, `${qid}.${oid} guess_series`).toContain(opt.guess_series);
      }
    }
  });

  it("every style copy_tag has a bullet to render", () => {
    // whyThis() walks copyTags and keeps the first three that have a bullet, so
    // a tag with no bullet costs the result screen a reason with no error.
    // Q13/Q14 tags are exempt: they feed courtPersona() and the MBTI copy
    // instead, and are never meant to appear as bullets.
    const RENDERED_ELSEWHERE = /^(strategist|explorer|commander|improviser|steady|craftsman|captain|showman|voice_)/;
    for (const { qid, oid, opt } of allOptions({ includeNudge: true })) {
      for (const tag of opt.copy_tags ?? []) {
        if (RENDERED_ELSEWHERE.test(tag)) continue;
        expect(TAG_BULLET_KEYS, `${qid}.${oid} copy_tag "${tag}"`).toContain(tag);
      }
    }
  });

  it("Q13 personality options map to known MBTI types", () => {
    const q13 = qs.find((q) => q.id === "Q13");
    const ids = new Set((q13?.options ?? []).map((o: any) => o.id));
    for (const [oid, types] of Object.entries(Q13_OPTION_TO_TYPES)) {
      expect(ids, `Q13_OPTION_TO_TYPES has "${oid}" but Q13 does not`).toContain(oid);
      for (const t of types) expect(MBTI[t], `unknown MBTI type ${t}`).toBeDefined();
    }
  });

  it("ranked_pick questions can be answered and target real axes", () => {
    for (const q of qs.filter((x) => x.type === "ranked_pick")) {
      expect(q.options.length, `${q.id} needs at least ${q.pick} options`).toBeGreaterThanOrEqual(q.pick ?? 3);
      expect(q.rank_multipliers?.length, `${q.id}.rank_multipliers`).toBeGreaterThanOrEqual(q.pick ?? 3);
      for (const o of q.options) {
        if (typeof o.target !== "string") continue;
        if (AXES.includes(o.target)) continue;
        // non-axis targets steer mass or head instead, and must say how
        const steers = typeof o.sw_target_delta === "number" || typeof o.head_pref_delta === "number";
        expect(steers, `${q.id}.${o.id} target "${o.target}" is not an axis and moves nothing`).toBe(true);
      }
    }
  });

  it("option ids are unique within a question", () => {
    for (const q of qs) {
      const ids = [...(q.options ?? []), ...(q.fields ?? []).flatMap((f: any) => f.options ?? [])].map((o: any) => o.id);
      expect(new Set(ids).size, `${q.id} has duplicate option ids`).toBe(ids.length);
    }
  });
});
