/**
 * Pure scoring engine. Zero UI dependency, zero DOM.
 *
 * Design rule: this file contains NO domain nouns. It knows only about
 * `axes[j]`, `items[i]`, `gates[k]`, deltas and weights. Every piece of
 * domain knowledge (which axis, which threshold, which constant) lives in
 * the two JSON configs. Swap the configs for a different questionnaire and
 * this engine runs unchanged.
 *
 * The one pragmatic exception: the advanced/beginner branch threshold is
 * only expressed in prose inside the config (`logic` strings), never in a
 * machine-readable field, so it is read from `meta.scoring.advanced_level`
 * when present and otherwise falls back to ADVANCED_LEVEL_FALLBACK.
 */

const ADVANCED_LEVEL_FALLBACK = 3.5;

export type Vector = Record<string, number>;

export type RankedPick = string[];
export type Answer = string | string[] | Record<string, string | string[]>;
export type Answers = Record<string, Answer>;

export type Match = {
  id: string;
  series: string;
  model: string;
  matchPct: number;
  vector: Vector;
  sw: number;
  ra: number;
};

export type Result = {
  matches: Match[]; // Top 3
  userIdeal: Vector;
  swTarget: number;
  weights: Record<string, number>;
  effectiveNtrp: number;
  ntrpDowngraded: boolean;
  guessedSeries: string | null;
  guessCorrect: boolean;
  copyTags: string[];
  excluded: { id: string; reason: string }[];
};

// ---- config shapes (loose on purpose; the engine walks structure) ----

type OptionLike = Record<string, any>;

type Question = {
  id: string;
  type: string;
  layer?: string[];
  options?: OptionLike[];
  fields?: { id: string; layer?: string; options?: OptionLike[] }[];
  rank_multipliers?: number[];
  [k: string]: any;
};

export type QuestionsConfig = {
  meta: {
    axes: string[];
    baseline: Record<string, number>;
    sw_target_base_by_ntrp: Record<string, number>;
    scoring: {
      calibrated: { alpha: number; k: number; sw_clamp: [number, number] };
      advanced_level?: number;
      [k: string]: any;
    };
    special_gates?: Record<
      string,
      { require_all: string[]; score_multiplier?: number; reason?: string }
    >;
    [k: string]: any;
  };
  questions: Question[];
};

type Racquet = {
  id: string;
  series: string;
  model: string;
  vector: Vector;
  sw: number;
  ra: number;
  head: number;
  difficulty: number;
  cosmetic?: boolean;
  inherits?: string;
  gate?: Record<string, any>;
  score_multiplier?: number;
  [k: string]: any;
};

export type RacquetsConfig = {
  meta: { axes: string[]; mass_axis: string; [k: string]: any };
  racquets: Racquet[];
};

export type Config = { questions: QuestionsConfig; racquets: RacquetsConfig };

// ---------------------------------------------------------------------------

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Resolve every selected option object from the answers, tagged with the
 * question it came from and (for ranked picks) its rank index.
 */
function selectedOptions(
  q: Question,
  answer: Answer | undefined
): { opt: OptionLike; rankIndex: number | null }[] {
  if (answer === undefined || answer === null) return [];
  const out: { opt: OptionLike; rankIndex: number | null }[] = [];

  const byId = (opts: OptionLike[] | undefined, id: string) =>
    (opts || []).find((o) => o.id === id);

  if (q.type === "ranked_pick") {
    const arr = Array.isArray(answer) ? (answer as string[]) : [];
    arr.forEach((id, i) => {
      const o = byId(q.options, id);
      if (o) out.push({ opt: o, rankIndex: i });
    });
    return out;
  }

  if (q.type === "dual_select" || q.type === "composite") {
    const obj = answer as Record<string, string | string[]>;
    for (const field of q.fields || []) {
      const picked = obj[field.id];
      if (picked === undefined) continue;
      const ids = Array.isArray(picked) ? picked : [picked];
      for (const id of ids) {
        const o = byId(field.options, id);
        if (o) out.push({ opt: o, rankIndex: null });
      }
    }
    return out;
  }

  // single (and anything else keyed by a single option id)
  const id = answer as string;
  const o = byId(q.options, id);
  if (o) out.push({ opt: o, rankIndex: null });
  return out;
}

/** Every selected option across the whole questionnaire. */
function allSelected(
  qcfg: QuestionsConfig,
  answers: Answers
): { q: Question; opt: OptionLike; rankIndex: number | null }[] {
  const out: { q: Question; opt: OptionLike; rankIndex: number | null }[] = [];
  for (const q of qcfg.questions) {
    for (const s of selectedOptions(q, answers[q.id])) {
      out.push({ q, opt: s.opt, rankIndex: s.rankIndex });
    }
  }
  return out;
}

export function score(answers: Answers, config: Config, opts?: { topN?: number }): Result {
  const topN = opts?.topN ?? 3;
  const qmeta = config.questions.meta;
  const axes = qmeta.axes;
  const massAxis = config.racquets.meta.mass_axis;
  const baseline = qmeta.baseline;
  const { alpha, k, sw_clamp } = qmeta.scoring.calibrated;
  const advancedLevel = qmeta.scoring.advanced_level ?? ADVANCED_LEVEL_FALLBACK;

  const sel = allSelected(config.questions, answers);

  // ---- effective level (min of all claimed level + all caps) ----
  let claimed = Infinity;
  let effective = Infinity;
  for (const { opt } of sel) {
    if (typeof opt.ntrp === "number") {
      claimed = Math.min(claimed, opt.ntrp);
      effective = Math.min(effective, opt.ntrp);
    }
    if (typeof opt.ntrp_cap === "number") {
      effective = Math.min(effective, opt.ntrp_cap);
    }
  }
  if (!isFinite(claimed)) claimed = baseline.ntrp ?? 3.0;
  if (!isFinite(effective)) effective = claimed;
  const effectiveNtrp = effective;
  const ntrpDowngraded = claimed > effective;
  const advanced = effectiveNtrp >= advancedLevel;

  // ---- injury flag (config-driven tag) ----
  const copyTags: string[] = [];
  for (const { opt } of sel) {
    if (Array.isArray(opt.copy_tags)) copyTags.push(...opt.copy_tags);
  }
  const injured = copyTags.includes("injured");

  // ---- step1: user_ideal ----
  const userIdeal: Vector = {};
  for (const a of axes) userIdeal[a] = baseline[a] ?? 50;

  const addDelta = (d: Record<string, number> | undefined) => {
    if (!d) return;
    for (const a of axes) if (typeof d[a] === "number") userIdeal[a] += d[a];
  };

  for (const { q, opt } of sel) {
    // nudge-layer deltas (Q13/Q14) are ±4 tie-breakers, never part of the ideal
    if ((q.layer || []).includes("nudge")) continue;
    if (opt.delta_advanced || opt.delta_beginner) {
      addDelta(advanced ? opt.delta_advanced : opt.delta_beginner);
    } else {
      addDelta(opt.delta);
    }
  }
  for (const a of axes) userIdeal[a] = clamp(userIdeal[a], 0, 100);

  // ---- head preference ----
  let headPref = baseline.head_pref ?? 100;
  for (const { opt } of sel) {
    if (typeof opt.head_pref_delta === "number") headPref += opt.head_pref_delta;
    if (!advanced && typeof opt.head_pref_delta_beginner === "number") {
      headPref += opt.head_pref_delta_beginner;
    }
  }

  // ---- step2: sw_target ----
  // base comes from the level table; the level-defining question (options that
  // carry `ntrp`) already encodes the base, so its sw_target_delta is skipped.
  const table = qmeta.sw_target_base_by_ntrp;
  const entries = Object.keys(table)
    .map((key) => ({ key, num: Number(key) }))
    .sort((a, b) => a.num - b.num);
  let base = table[entries[0].key];
  for (const e of entries) if (effectiveNtrp >= e.num) base = table[e.key];

  let swTarget = base;
  for (const { opt } of sel) {
    if (typeof opt.ntrp === "number") continue; // base already applied
    if (typeof opt.sw_target_delta === "number") swTarget += opt.sw_target_delta;
  }
  swTarget = clamp(swTarget, sw_clamp[0], sw_clamp[1]);

  // ---- step3: weights (ranked_pick) ----
  const weights: Record<string, number> = {};
  for (const a of axes) weights[a] = 1.0;
  for (const { q, opt, rankIndex } of sel) {
    if (rankIndex === null) continue;
    const mult = (q.rank_multipliers || [])[rankIndex] ?? 1.0;
    const target = opt.target as string | undefined;
    if (target && axes.includes(target)) {
      weights[target] = mult;
    }
    // non-axis targets (mass / head) contribute their own deltas instead
    if (typeof opt.sw_target_delta === "number") swTarget += opt.sw_target_delta;
    if (typeof opt.head_pref_delta === "number") headPref += opt.head_pref_delta;
  }
  swTarget = clamp(swTarget, sw_clamp[0], sw_clamp[1]);

  // ---- collect option-level gates (from answers) ----
  const optionGates: Record<string, any>[] = [];
  for (const { opt } of sel) if (opt.gate) optionGates.push(opt.gate);

  // ---- special gates (series-level, e.g. hard difficulty tier) ----
  const specialFailedSeries = new Set<string>();
  for (const [series, spec] of Object.entries(qmeta.special_gates || {})) {
    const ok = spec.require_all.every((cond) =>
      evalCondition(cond, { effectiveNtrp, answers })
    );
    if (!ok) specialFailedSeries.add(series);
  }

  // ---- step0: gate every racquet ----
  const excluded: { id: string; reason: string }[] = [];
  const survivors: Racquet[] = [];

  for (const r of config.racquets.racquets) {
    if (r.cosmetic) continue; // dedupe paint jobs before ranking

    const fail = gateReason(r, {
      optionGates,
      racquetGate: r.gate || {},
      effectiveNtrp,
      injured,
      specialFailedSeries,
      massAxis,
    });
    if (fail) {
      excluded.push({ id: r.id, reason: fail });
      continue;
    }
    survivors.push(r);
  }

  // ---- steps 4-7: score survivors ----
  const wSum = axes.reduce((s, a) => s + weights[a], 0);

  const scoreOf = (r: Racquet): number => {
    // step4 style distance
    let acc = 0;
    for (const a of axes) {
      const diff = userIdeal[a] - (r.vector[a] ?? 0);
      acc += weights[a] * diff * diff;
    }
    const styleDist = Math.sqrt(acc / wSum);

    // step5 asymmetric mass penalty
    const d = (r as any)[massAxis] - swTarget;
    const swPenalty =
      d > 0 ? Math.abs(d) * k : Math.abs(d) * k * (injured ? 0.2 : 0.5);

    // step6 head penalty
    const headPenalty = Math.max(0, headPref - r.head) * 0.3;

    // step7 total
    const mult = r.score_multiplier ?? 1.0;
    return (100 - (styleDist * alpha + swPenalty + headPenalty)) * mult;
  };

  const ranked = survivors
    .map((r) => ({ r, s: scoreOf(r) }))
    .sort((a, b) => b.s - a.s);

  const matches: Match[] = ranked.slice(0, topN).map(({ r, s }) => ({
    id: r.id,
    series: r.series,
    model: r.model,
    matchPct: Math.round(s * 10) / 10,
    vector: r.vector,
    sw: r.sw,
    ra: r.ra,
  }));

  // ---- guess (Q15) ----
  let guessedSeries: string | null = null;
  for (const { opt } of sel) {
    if (typeof opt.guess_series === "string") guessedSeries = opt.guess_series;
  }
  const guessCorrect =
    guessedSeries !== null && matches.length > 0 && matches[0].series === guessedSeries;

  return {
    matches,
    userIdeal,
    swTarget,
    weights,
    effectiveNtrp,
    ntrpDowngraded,
    guessedSeries,
    guessCorrect,
    copyTags: Array.from(new Set(copyTags)),
    excluded,
  };
}

// ---------------------------------------------------------------------------

/** Evaluate a special-gate condition string like "effective_ntrp>=4.0" or "Q3==q3a". */
function evalCondition(
  cond: string,
  ctx: { effectiveNtrp: number; answers: Answers }
): boolean {
  const m = cond.match(/^([A-Za-z0-9_]+)\s*(>=|<=|==|>|<)\s*(.+)$/);
  if (!m) return true;
  const [, lhs, op, rhsRaw] = m;
  const rhs = rhsRaw.trim();

  let left: string | number;
  if (lhs === "effective_ntrp") {
    left = ctx.effectiveNtrp;
  } else {
    // treat as a question id whose answer is a single option id
    const a = ctx.answers[lhs];
    left = typeof a === "string" ? a : "";
  }

  const rhsNum = Number(rhs);
  const numeric = !isNaN(rhsNum) && typeof left === "number";

  switch (op) {
    case ">=":
      return numeric && (left as number) >= rhsNum;
    case "<=":
      return numeric && (left as number) <= rhsNum;
    case ">":
      return numeric && (left as number) > rhsNum;
    case "<":
      return numeric && (left as number) < rhsNum;
    case "==":
      return numeric ? (left as number) === rhsNum : String(left) === rhs;
  }
  return true;
}

/**
 * Returns a reason string if the racquet fails any gate, else null.
 * All gate keys are generic property predicates over the racquet.
 */
function gateReason(
  r: Racquet,
  ctx: {
    optionGates: Record<string, any>[];
    racquetGate: Record<string, any>;
    effectiveNtrp: number;
    injured: boolean;
    specialFailedSeries: Set<string>;
    massAxis: string;
  }
): string | null {
  if (ctx.specialFailedSeries.has(r.series)) {
    return `series_gated:${r.series}`;
  }

  // option-supplied gates (from the user's answers)
  for (const g of ctx.optionGates) {
    if (typeof g.max_difficulty === "number" && r.difficulty > g.max_difficulty)
      return `difficulty>${g.max_difficulty}`;
    if (typeof g.min_head === "number" && r.head < g.min_head)
      return `head<${g.min_head}`;
    if (typeof g.max_ra === "number" && r.ra > g.max_ra) return `ra>${g.max_ra}`;
    if (
      typeof g.min_strung_weight === "number" &&
      typeof (r as any).strung_weight === "number" &&
      (r as any).strung_weight < g.min_strung_weight
    )
      return `strung_weight<${g.min_strung_weight}`;
    if (Array.isArray(g.exclude_series) && g.exclude_series.includes(r.series))
      return `excluded_series:${r.series}`;
  }

  // racquet-side gates
  const rg = ctx.racquetGate;
  if (typeof rg.min_ntrp === "number" && ctx.effectiveNtrp < rg.min_ntrp)
    return `ntrp<${rg.min_ntrp}`;
  if (ctx.injured) {
    if (rg.injury_safe === false) return "not_injury_safe";
    if (typeof rg.max_ra_if_injured === "number" && r.ra > rg.max_ra_if_injured)
      return `ra>${rg.max_ra_if_injured}_injured`;
  }

  return null;
}
