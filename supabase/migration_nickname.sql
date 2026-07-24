-- 若你已經跑過舊版 schema.sql，補這一行加上 nickname 欄。
-- 全新建的表（新版 schema.sql 已含）不用跑。
alter table responses add column if not exists nickname text;
