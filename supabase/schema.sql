-- HEAD 選拍測驗 · Supabase schema
-- 一張表。RLS 只開 INSERT（anon key 只能寫，不能讀）。分析走 Supabase Dashboard。
--
-- 在新的 Supabase project 的 SQL Editor 貼上執行。
-- ⚠️ 依 CLAUDE_CODE_BUILD_SPEC.md §1：這個 project 必須是獨立的，並加第二位 owner。

create table if not exists responses (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  answers        jsonb not null,          -- 15 題原始作答
  result         jsonb,                   -- Top3 + 匹配度 + user_ideal（未完成時可為 null）
  ntrp_claimed   numeric,                 -- Q1 自評
  ntrp_inferred  numeric,                 -- Q2 校準後
  current_racquet text,                   -- Q4 現用拍（含競品！）
  gender         text,                    -- 選填，不進引擎
  age_band       text,                    -- 選填
  completed      boolean not null default false,  -- 是否答滿 15 題
  config_version text                     -- 對應 racquets.json 的 meta.version
);

alter table responses enable row level security;

-- 只允許 INSERT（新增），不開 SELECT / UPDATE / DELETE 給 anon。
drop policy if exists "anon insert only" on responses;
create policy "anon insert only"
  on responses
  for insert
  to anon
  with check (true);
