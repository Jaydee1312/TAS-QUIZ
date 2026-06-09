-- =====================================================================
-- TAS GLOBAL QUIZ — 0006 Thưởng theo hạng (top 1 / top 3 / top 5)
-- Chạy SAU 0001..0005.
-- =====================================================================

-- Mặc định 0 = tắt (giữ nguyên hành vi cũ: chỉ có points_top_rank cho top N).
-- Khi >0: user đạt hạng tương ứng nhận mức điểm CAO NHẤT trong các mốc áp dụng.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS points_rank_top1 INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_rank_top3 INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_rank_top5 INT NOT NULL DEFAULT 0;
