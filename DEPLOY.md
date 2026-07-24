# 上架步驟

> 依 CLAUDE_CODE_BUILD_SPEC.md §1：GitHub / Vercel / Supabase 各自**獨立** project，Supabase 需加第二位 owner。程式碼已 deploy-ready；下列是帳號端動作。

## 1. Supabase（獨立 project）

1. supabase.com → New project（**新開一個**，不與其他專案共用）。
2. SQL Editor → 貼上 `supabase/schema.sql` 執行（建 `responses` 表，RLS 只開 INSERT）。
3. Project Settings → API，複製：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Project Settings → Team → **加第二位 owner**（公司 IT / 負責人）。

本機測試：複製 `.env.local.example` 成 `.env.local` 填入上面兩個值，`npm run dev`。

## 2. Vercel（獨立 project）

1. vercel.com → Add New Project → Import `BamHIHedgeFundCEO/head_tennis_racket-`（**新 project**，獨立網域 / 環境變數）。
2. Environment Variables 加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy。Framework 自動偵測 Next.js，無需額外設定。

> 沒填 Supabase env 也能部署 —— app 照跑，只是作答不寫 DB（`supabase` client 為 null，寫入變 no-op）。可先上線再補 env。

## 寫入行為（已實作）

- 每答一題 → 存 localStorage（離線不掉資料）。
- 答完 15 題 / 提早看結果 → INSERT 一列 `completed=true` + result。
- 中途離開（pagehide / 切分頁）→ INSERT 一列 `completed=false`（部分作答一樣進 DB）。
- 離線送失敗 → 存 queue，下次開啟自動補送。
- ⚠️ `gender` 只存 DB，**不進** `score()`。
