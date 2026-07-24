# HEAD 本命球拍測驗 · 完整建置規格

> 這份文件是給 Claude Code 的完整任務說明。
> 附帶兩個 config 檔：`racquets.json`、`questions.json`（已驗證校準完成，**不要修改內容**）。

---

## 0. 專案是什麼

HEAD 網球拍台灣總代理的官方選拍工具。使用者回答 15 題，系統從 36 支 HEAD 球拍中算出最適合的 Top 3，附匹配度、推薦理由、可分享的成績圖卡。

**兩個商業目的**（會影響你的技術決策）：
1. 對消費者：把 36 支拍收斂成「值得去店裡試打的 3 支」
2. 對公司：每份作答都是結構化市場資料 → 所以**作答一定要寫進資料庫**，即使使用者中途離開

**鐵則：Top 3 永遠只能是 HEAD 球拍。** 這是總代理的商業底線，不得推薦競品。

---

## 1. 技術架構

```
Next.js (App Router) + TypeScript  →  Vercel
├── /config/racquets.json      ← 球拍資料（進 repo，不進 DB）
├── /config/questions.json     ← 題庫與評分規則（進 repo）
├── /engine/score.ts           ← 純函數評分引擎（零 UI 依賴）
├── /engine/score.test.ts      ← vitest
├── /app/api/og/route.tsx      ← 分享圖卡（Vercel OG，Edge）
└── Supabase                   ← 只有一張 responses 表
```

### 帳號與專案隔離

沿用開發者現有的 GitHub / Vercel / Supabase 帳號，但**這個專案必須是獨立的 project / repo**：

| 服務 | 做法 |
|---|---|
| GitHub | 同帳號下**新開一個 repo**，不要放進其他既有專案的 repo |
| Vercel | 同帳號下**新開一個 project**，獨立網域、獨立環境變數 |
| Supabase | 同帳號下**新開一個 project**，資料庫完全隔離。**加第二位 owner**（公司 IT 或負責人）以確保開發者不在時仍可維運 |

**不要與帳號下的其他專案共用資料庫、共用環境變數、或把程式碼混進同一個 repo。**
這個專案會蒐集消費者個資，資料必須獨立可稽核、可單獨移交。

### 為什麼引擎跑在 client 端
推薦引擎是純函數：36 支拍 × 4 軸 = 一百多次乘法，瀏覽器 0.2ms 跑完。不需要後端 API。

**附帶好處**：店內網路不穩也能用。作答先存 localStorage，連上線再補送 Supabase。

### 為什麼 config 放 repo 不放 DB
球拍向量是**評分邏輯**，不是文案。改一個數字會改變所有人的推薦結果。放 repo = 改分數要 PR = 有 git blame = 有人 review。

---

## 2. 評分引擎 `engine/score.ts`

### 介面

```ts
export type Answers = Record<string, string | string[] | RankedPick>;
export type Result = {
  matches: { id: string; series: string; model: string; matchPct: number;
             vector: Vector; sw: number; ra: number }[];  // Top 3
  userIdeal: Vector;
  swTarget: number;
  weights: Record<Axis, number>;
  effectiveNtrp: number;
  ntrpDowngraded: boolean;      // Q1 自評 > Q2 校準後
  guessedSeries: string | null; // Q15
  guessCorrect: boolean;
  copyTags: string[];           // 給文案層用
  excluded: { id: string; reason: string }[];  // 給「為什麼不是」用
};

export function score(answers: Answers, config: Config): Result;
```

### 硬性要求

1. **引擎程式碼裡不准出現任何網球專有名詞。** 沒有 `spin`、沒有 `racquet`、沒有 `ntrp` 寫死。只有 `axes[j]`、`items[i]`、`gates[k]`。所有領域知識都在 json 裡。
   - **驗收條件**：不動引擎任何一行，只換一個 config 檔，能不能生出一份「選網球線」的問卷？能 → 抽象成立。
2. **零 UI 依賴。** 不 import React，不碰 DOM。要能被 vitest 直接跑。
3. **不硬編任何常數。** α、k、clamp 範圍全部讀 `questions.json` 的 `meta.scoring.calibrated`。

### 演算法：完全照 `questions.json` 的 `meta.scoring` 七步驟

```
step0  Gate 硬篩      → 依 Q1/Q2/Q3 剔除候選；Prestige 另有 special_gates
step1  user_ideal     → 4 軸各從 50 起，累加所有 engine 層 delta，clamp 0–100
step2  sw_target      → base_by_ntrp + 所有 sw_target_delta，clamp [290, 330]
step3  weights        → Q12 排序 → [3.0, 2.0, 1.5]，未選 = 1.0
step4  style_dist     → sqrt( Σ w[j]*(user[j]-item[j])² / Σ w[j] )
step5  sw_penalty     → 不對稱（見下方警告）
step6  head_penalty   → max(0, head_pref - item.head) * 0.3
step7  match%         → (100 - (style_dist*α + sw_penalty + head_penalty)) * score_multiplier
```

### ⚠️ 三個最容易寫錯的地方

**① Q7 力量題，兩個方向相反是刻意的**
```
選「我就是引擎，能打重球」→ power -20（給控制拍）
                          → sw_target +10（他揮得動重拍）
```
不是 bug。有力量的人需要的是壓得住球的控制拍，不是更有力的拍；但他確實揮得動高揮重。**這行寫反，整套系統的專業度歸零。**

**② SW 罰分是不對稱的，寫成 `Math.abs()` 就錯了**
```ts
const d = item.sw - swTarget;
const penalty = d > 0
  ? Math.abs(d) * k                              // 比目標重 → 全罰（揮不動）
  : Math.abs(d) * k * (injured ? 0.2 : 0.5);     // 比目標輕 → 半罰；傷者只罰兩成
```
對網球肘的人，輕拍是**優點**不是缺點。這個修正讓 SQUARED 從第 3 名升到第 1 名。

**③ sw_target 一定要 clamp 到 [290, 330]**
那是實際球拍 SW 的真實範圍。不 clamp，新手組的 sw_target 會疊到 263，所有拍全被罰，Top1 掉到 73%。

**④ 塗裝款要去重**
`cosmetic: true` 的型號（Speed Legend、Boom Alternate）**不進排名**。它們的規格和本尊完全相同，會佔滿 Top 3。
正確做法：Top1 命中本尊 → 在文案層提一句「這支有 Legend / 紫色版本」。

### 測試 `engine/score.test.ts`（期望值已人工驗證，必須全過）

| # | 情境 | 期望 |
|---|---|---|
| 1 | 網球肘 + 要力量旋轉 | Top1 = `squared_squared` |
| 2 | 上旋暴力 + 健康 + 體力好 | Top1 = `extreme_mp` |
| 3 | 中階、無特別偏好 | Top1 屬於 SPEED 系列 |
| 4 | NTRP 2.0 新手 | 結果不得出現 `difficulty > 15` 的拍 |
| 5 | 任何 Q3 = `q3c`（網球肘） | 結果不得出現 `ra > 63` 的拍 |
| 6 | 任何作答 | Top 3 全部是 HEAD；不得出現 `cosmetic: true` |
| 7 | 任何作答 | Top1 的 matchPct 落在 85–95 |

CI 跑不過不准 merge。**這是這個產品和「另一個行銷小遊戲」的唯一區別。**

---

## 3. UI 流程

### 3.1 視覺方向

**關鍵詞：精密儀器、航太科技、極簡、hardcore。**
不是可愛測驗風。想像一個懂球的高手做的診斷工具，不是給小朋友玩的。

```
底色      深炭黑 #1A1A1A（深色模式為主）
訊號色    ⚠️ 待定：螢光橘 #FF4D00 或 電光黃綠 #D4FF00（開發者確認）
其餘      大量留白 + 灰階
字體      標題：工業感無襯線粗體（Archivo / Suisse 類）
          中文：思源黑體 Bold
          數字：特別突出，匹配度百分比要像儀表板讀數
圓角      8–12px（銳利一點，不要泡泡感）
選項      未選 = outline；選中 = 填滿訊號色 + 微微發光（機械開關的回饋感）
進度條    細、精準，像實驗室儀器讀數
```

**手機優先。** 一題一屏。

### 3.2 畫面清單

| 畫面 | 內容 |
|---|---|
| **開場** | 大標「找到你的本命球拍」+ 副標 + CTA + 三個小標籤（約3分鐘 / 免註冊 / HEAD 官方）+ **3D 幾何線框球拍**（緩慢自轉，手指可撥動） |
| **Q1–Q15** | 進度條 + 「N / 15」+ 分站標題 + 問題 + 副標 + 選項卡片。**純 2D，不要任何動態背景**（使用者在做決定，不要干擾） |
| **結果頁** | 見 3.4 |
| **業務欄位** | 結果頁之後才問（見 3.5） |

### 3.3 題型與互動

`questions.json` 的 `type` 欄位對應：

| type | 互動 |
|---|---|
| `single` | 單選卡片，點擊即進下一題（不需要「下一步」按鈕，減少一次點擊） |
| `dual_select` | Q2，兩個下拉 |
| `composite` | Q4，搜尋框 + 多選（最多 2 項，選滿第 3 個時提示） |
| `ranked_pick` | Q12，**依序點三下**，點過的顯示 1️⃣2️⃣3️⃣。**不要用拖曳**（手機易誤觸） |

**提早退出機制：**
Q11 答完後，進度條顯示「✓ 已可產生結果 · 再答 4 題更懂你」，並出現「直接看結果」按鈕。
- 未答的 Q12 → 權重全部 = 1.0
- 未答的 Q13–15 → nudge = 0，文案走預設版

店裡趕時間的人 11 題就能拿到結果，躺沙發的人答完 15 題拿分享卡。**同一套 UI、同一顆引擎、一個按鈕解決。**

### 3.4 結果頁（六個區塊，順序不能換）

**① Hero**
```
你的本命球拍
HEAD Gravity MP
[巨大的 89%]  ← 整頁視覺焦點，像儀表板讀數
[清脆控制] [大甜區] [單反友善]   ← 三個標籤
+ 3D 球拍（360度可撥動，配色對應該型號）
```

**② 為什麼是它**
3–4 句，**每句必須對應他真實的答案**，禁止套話。
```
✅「你在 Q9 選了柔軟包覆，Gravity 全系列 RA 57–59，是 HEAD 最軟的一條線。」
❌「這支球拍的適用水平與你當前階段比較接近。」← 套哪支都成立 = 沒說服力
```

**③ 為什麼不是另一支 HEAD** ⭐ 這是整個產品的殺手鐧
```
「你可能想問為什麼不是 Speed？
 因為你在 Q10 選了速戰速決，Speed MP 的 SW 329 會讓你第三盤揮不動 —— 那不是你。」
```
實作：取 Top 2 或被 Gate 剔除的高分拍，用 `excluded[].reason` 生成。
**競品完全沒有這一段，這是你贏他的地方。**

**④ 直覺 vs 真實**（Q15 反差梗）
- 猜中 → 「你很懂自己 👏」
- 猜錯 → 「你以為你是 Gravity，但你的打法出賣了你 😏」

**⑤ 其他 HEAD 選擇**
Top 2 / Top 3，標「比第一名更偏 X，匹配度低 N 分」

**⑥ 分享圖卡 + 加 LINE**
Vercel OG 生成 PNG（IG Story 直式尺寸 1080×1920）。
LINE 官方帳號是留存的唯一入口 —— IG 負責擴散，LINE 負責回訪。

### 3.5 業務欄位（結果頁之後才問）

```
（選填）想順便看穿搭建議嗎？   男 / 女 / 不想說
年齡層下拉
加 LINE 領完整報告
```

**⚠️ 性別問了、存了，但一個位元都不准進 `score()`。**
理由：Q7 已經直接問了力量，性別是它會出錯的劣質代理。「女生 → 自動輕拍」會把一個 4.0 的女球友推去 265g 的入門拍，她會直接關掉。
用途只有一個：讓採購知道台灣市場的男女比例。

---

## 4. 資料庫（Supabase 一張表）

```sql
create table responses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  answers       jsonb not null,        -- 15 題原始作答
  result        jsonb not null,        -- Top3 + 匹配度 + user_ideal
  ntrp_claimed  numeric,               -- Q1 自評
  ntrp_inferred numeric,               -- Q2 校準後
  current_racquet text,                -- Q4 現用拍（含競品！）
  gender        text,                  -- 選填，不進引擎
  age_band      text,
  completed     boolean,               -- 是否答滿 15 題
  config_version text                  -- 對應 racquets.json 的 meta.version
);
```

**RLS 只開 `INSERT`**，用 anon key。不需要讀取權限（分析走 Supabase Dashboard）。

**兩個欄位要特別注意：**
- `ntrp_claimed` vs `ntrp_inferred` 的落差本身就是一份研究（「台灣球友平均高估自己 N 級」）
- `current_racquet` 會告訴你多少台灣人正在用 Wilson / Babolat —— 這是總代理拿去跟原廠開會的子彈

**寫入時機：每答完一題就 upsert 一次**，不要等全部答完。使用者中途離開的作答一樣有價值。

---

## 5. 品牌與法遵

| 項目 | 做法 |
|---|---|
| **HEAD logo** | 開發階段用文字佔位符「HEAD」，**預留位置和留白**（開場頁頂部、結果頁、分享圖卡）。真檔由開發者提供。**絕對不要自己畫一個 HEAD logo。** |
| **logo 改色** | ⚠️ 不可以。官方 logo 通常只有指定的黑/白兩版，不能改成訊號色 |
| **隱私政策頁** | 必須有。抬頭寫公司全名 + 統編，說明蒐集目的、期間、當事人權利 |
| **帳號歸屬** | 沿用開發者現有帳號，但**必須是獨立的 repo / project**（見 §1）。Supabase 需加第二位 owner |
| **個資蒐集者** | 隱私政策與同意條款上的蒐集者必須是**公司法人**（總代理），不是個人。這與帳號登入者是誰無關 |

---

## 6. 明確不要做的事

- ❌ 不要推薦任何非 HEAD 球拍
- ❌ 不要為了行銷調高滯銷型號的分數。**若要庫存感知，只能在匹配度差距 < 3% 時調整排序，不能改分數。** 這條界線用架構強制：config 進 repo，改分數要 PR。
- ❌ 不要在問卷中段放 3D 或動態背景
- ❌ 不要把性別、預算、握把尺寸接進 `score()`
- ❌ 不要讓 `cosmetic: true` 的塗裝款進排名
- ❌ 不要自己編球拍規格。所有數字來自 `racquets.json`，缺的就是缺的。
- ❌ 不要與帳號下的其他專案共用 Supabase 資料庫或環境變數 —— 這個專案有消費者個資，必須獨立。

---

## 7. 建置順序

```
1. engine/score.ts + 測試          ← 先做這個，其他都建立在它上面
2. 題目流程 UI（Q1–Q15）
3. 結果頁（六個區塊）
4. Supabase 寫入
5. Vercel OG 分享圖卡
6. 3D 元素（開場 + 結果頁）        ← 最後做，不影響核心功能
```

**第 1 步的測試全過之前，不要開始做 UI。**

---

## 8. 尚未定案（開發者需確認）

| 項目 | 狀態 |
|---|---|
| 訊號色 | 橘 #FF4D00 或黃綠 #D4FF00，二選一 |
| HEAD logo 檔 | 需向原廠索取 .svg 正式版 + 品牌準則 |
| 台灣售價 | `racquets.json` 的 `price` 欄目前為空 |
| 結果頁文案庫 | MBTI × 七系列的語錄尚未撰寫，先用預設版 |
| 3D 球拍模型 | V1 用幾何線框示意；V2 再換原廠 .glb 模型 |

---

## 附錄：config 檔的資料來源與已知限制

**`racquets.json`**
- 36 支 HEAD 球拍（SPEED / RADICAL / GRAVITY / EXTREME / BOOM / PRESTIGE / SQUARED）
- 拍面、線床、框厚、CPI 來自 HEAD 2026 型錄
- SW、RA、穿線重量來自 Tennis Warehouse 商品頁實測
- Compass_X / Compass_Y 為 HEAD 官方羅盤圖**目測**，誤差 ±5
- 4 軸向量由規格經公式推導（公式寫在 `meta.formula`）
- 已通過六項專家共識驗收（Prestige 最控制 / Boom 最有力量 / Extreme 最旋轉且最不舒適 / Gravity 最護手臂 / Prestige 最難駕馭 / SQUARED 是「護手臂又要力量」的唯一解）

**`questions.json`**
- 15 題，分四層：gate（3）/ engine（9）/ weight（1）/ copy（3）
- 參數已校準：α = 0.62、k = 0.30、sw_clamp = [290, 330]
- 五個測試人格 Top1 落在 89.6–92.9%

**已知限制（不要當成 bug 回報）**
- CPI 與 Compass_X 相關係數 0.918，故合併為單一力量軸，非各自獨立
- PRESTIGE 與 SQUARED 不在 HEAD 官方羅盤圖上，座標由規格反推
- 羅盤座標為目測，若原廠日後提供向量檔應優先覆蓋
