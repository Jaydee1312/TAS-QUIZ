-- =====================================================================
-- TAS GLOBAL QUIZ — 0004 App settings (mức điểm chỉnh từ admin UI)
-- Chạy SAU 0001 + 0002 (+ 0003).
-- =====================================================================

-- Bảng cấu hình toàn hệ thống, chỉ 1 dòng (id = 1).
CREATE TABLE IF NOT EXISTS public.app_settings (
  id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  points_completion INT NOT NULL DEFAULT 10,  -- điểm khi hoàn thành bài
  points_high_score INT NOT NULL DEFAULT 5,   -- điểm khi đạt ngưỡng %
  points_top_rank   INT NOT NULL DEFAULT 10,  -- điểm khi lọt top N
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo sẵn dòng mặc định.
INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Ai đăng nhập cũng đọc được mức điểm (không phải bí mật); ghi bằng service role.
DROP POLICY IF EXISTS app_settings_select ON public.app_settings;
CREATE POLICY app_settings_select ON public.app_settings
  FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
