import type { Result, Answers } from "../engine/score";
import { racquetById } from "./config";

export const AXIS_ZH: Record<string, string> = {
  power: "力量",
  control: "控制",
  spin: "旋轉",
  comfort: "舒適",
};

const SERIES_ZH: Record<string, string> = {
  SPEED: "Speed",
  RADICAL: "Radical",
  GRAVITY: "Gravity",
  EXTREME: "Extreme",
  BOOM: "Boom",
  PRESTIGE: "Prestige",
  SQUARED: "SQUARED",
};

/** copy_tag -> a bullet that references the actual answer the user gave. */
const TAG_BULLET: Record<string, string> = {
  injured: "你回報過手肘/手腕不適,這支的框體剛性偏低、吸震柔和,對關節友善。",
  topspin: "你的正手主打上旋,開放弦床給你更充足的咬球與旋轉空間。",
  flat: "你走平擊穿透路線,這支的擊球回饋直接、出球扎實。",
  slice: "你常用切球擾亂,較低的揮重讓你切換與變化更靈活。",
  safe: "你求穩定回擊,這支容錯高、甜區集中,失誤更少。",
  self_powered: "你自帶引擎,不需要拍子額外加力,控制型框體讓你壓得住球。",
  ohbh: "你打單反,略低的揮重與清楚回饋幫你把單反打得更漂亮。",
  weak_bh: "你的反手偏弱,這支的容錯與甜區給你更多後盾。",
  singles: "你以單打為主,這支的重量與旋轉支撐你把對手跑開。",
  doubles: "你重視雙打網前,較低揮重讓你截擊反應更快。",
  feel_soft: "你要柔軟包覆的手感,這條線是 HEAD 最軟的一路。",
  feel_crisp: "你要清脆直接的回饋,這支的擊球反應乾淨俐落。",
  stamina_high: "你體力充足,扛得住高揮重,第三盤依然穩定。",
  stamina_low: "你傾向速戰速決,較輕的揮重讓你整場不易累。",
  full_swing: "你揮拍幅度大,高揮重能把你的揮速完整轉成球速。",
  compact: "你揮拍緊湊,較輕的配置讓你擋、切、快速反應都更順。",
};

export function seriesZh(series: string): string {
  return SERIES_ZH[series] ?? series;
}

export function racquetName(id: string): string {
  const r = racquetById.get(id);
  if (!r) return id;
  return `HEAD ${seriesZh(r.series)} ${r.model}`;
}

/** Three short chips for the hero, derived from the winner's standout axes. */
export function heroTags(result: Result): string[] {
  const top = result.matches[0];
  if (!top) return [];
  const v = top.vector;
  const ranked = Object.keys(v).sort((a, b) => v[b] - v[a]);
  const chips: string[] = [];
  const push = (s: string) => { if (!chips.includes(s) && chips.length < 3) chips.push(s); };

  if (result.copyTags.includes("injured")) push("護手臂");
  for (const axis of ranked) {
    if (v[axis] >= 60) push(`${AXIS_ZH[axis]}型`);
  }
  if (result.copyTags.includes("doubles")) push("雙打適用");
  if (result.copyTags.includes("singles")) push("單打取向");
  // pad from the level if still short
  push(result.effectiveNtrp >= 4 ? "進階" : result.effectiveNtrp >= 3 ? "中階" : "入門友善");
  return chips.slice(0, 3);
}

/** Answer-referential bullets. Prefers copy_tags the user actually triggered. */
export function whyThis(result: Result): string[] {
  const bullets: string[] = [];
  for (const tag of result.copyTags) {
    if (TAG_BULLET[tag] && !bullets.includes(TAG_BULLET[tag])) bullets.push(TAG_BULLET[tag]);
    if (bullets.length >= 3) break;
  }
  // fall back to the axes the user weighted most heavily (Q12)
  if (bullets.length < 3) {
    const top = result.matches[0];
    const weighted = Object.keys(result.weights)
      .filter((a) => result.weights[a] > 1)
      .sort((a, b) => result.weights[b] - result.weights[a]);
    for (const axis of weighted) {
      const val = top?.vector[axis];
      if (val === undefined) continue;
      const line = `你把「${AXIS_ZH[axis]}」排進打死都要的前幾名,這支在這一軸表現到位。`;
      if (!bullets.includes(line)) bullets.push(line);
      if (bullets.length >= 3) break;
    }
  }
  if (bullets.length === 0) {
    bullets.push("綜合你的技術、打法與取捨,這支的整體匹配度最高。");
  }
  return bullets.slice(0, 3);
}

/** "Why not the runner-up" — compares the No.2 against the winner on its strongest axis. */
export function whyNot(result: Result): { name: string; pct: number; reason: string } | null {
  const [top, second] = result.matches;
  if (!top || !second) return null;
  let bestAxis = "control";
  let bestDelta = -Infinity;
  for (const axis of Object.keys(second.vector)) {
    const d = second.vector[axis] - top.vector[axis];
    if (d > bestDelta) { bestDelta = d; bestAxis = axis; }
  }
  const swDiff = second.sw - top.sw;
  let reason: string;
  if (bestDelta > 4) {
    reason = `它更偏「${AXIS_ZH[bestAxis]}」,但整體與你的打法差了一點;` +
      (swDiff > 6 ? `而且揮重更高,你第三盤會更吃力。` : `你的取捨排序把第一名頂了上去。`);
  } else {
    reason = swDiff > 6
      ? `它的揮重更高,長盤下來你會比較累,所以退居第二。`
      : `各軸都很接近,但第一名在你最在意的軸更貼合。`;
  }
  return { name: racquetName(second.id), pct: Math.round(second.matchPct), reason };
}

/** Q15 gut-check reveal. */
export function guessReveal(result: Result): { correct: boolean; text: string } | null {
  if (!result.guessedSeries) return null;
  const topSeries = result.matches[0]?.series;
  if (result.guessCorrect) {
    return { correct: true, text: `你很懂自己 👏 直覺就猜中了 ${seriesZh(topSeries)}。` };
  }
  return {
    correct: false,
    text: `你以為你是 ${seriesZh(result.guessedSeries)},但你的打法出賣了你 😏 系統把你判給了 ${seriesZh(topSeries)}。`,
  };
}

/** Other HEAD options (Top2 / Top3) with a "leans more X, N points lower" tag. */
export function otherOptions(result: Result) {
  const [top] = result.matches;
  if (!top) return [];
  return result.matches.slice(1, 3).map((m) => {
    let bestAxis = "control";
    let bestDelta = -Infinity;
    for (const axis of Object.keys(m.vector)) {
      const d = m.vector[axis] - top.vector[axis];
      if (d > bestDelta) { bestDelta = d; bestAxis = axis; }
    }
    const gap = Math.round(top.matchPct - m.matchPct);
    return {
      id: m.id,
      name: racquetName(m.id),
      pct: Math.round(m.matchPct),
      tag: `比第一名更偏${AXIS_ZH[bestAxis]}，匹配度低 ${gap} 分`,
    };
  });
}
