-- =====================================================================
-- TAS GLOBAL QUIZ — 0002 Row Level Security policies
-- Chạy SAU 0001_initial_schema.sql
-- =====================================================================

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Helper: user hiện tại có phải admin không.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------- users ----------------
DROP POLICY IF EXISTS users_select_self ON public.users;
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- (Insert do trigger handle_new_user / service role lo; không mở cho client.)

-- ---------------- quizzes ----------------
DROP POLICY IF EXISTS quizzes_select_published ON public.quizzes;
CREATE POLICY quizzes_select_published ON public.quizzes
  FOR SELECT USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS quizzes_admin_all ON public.quizzes;
CREATE POLICY quizzes_admin_all ON public.quizzes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------- questions ----------------
-- User chỉ đọc câu hỏi của quiz đã publish (đáp án đúng vẫn lộ ở cấp DB,
-- nên trang làm bài gọi qua API/server và KHÔNG select correct_answer xuống client).
DROP POLICY IF EXISTS questions_select_published ON public.questions;
CREATE POLICY questions_select_published ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = questions.quiz_id AND (q.is_published = TRUE OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS questions_admin_all ON public.questions;
CREATE POLICY questions_admin_all ON public.questions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------- submissions ----------------
DROP POLICY IF EXISTS submissions_select_own ON public.submissions;
CREATE POLICY submissions_select_own ON public.submissions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS submissions_insert_own ON public.submissions;
CREATE POLICY submissions_insert_own ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------- points_history ----------------
DROP POLICY IF EXISTS points_select_own ON public.points_history;
CREATE POLICY points_select_own ON public.points_history
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Insert/update điểm thực hiện bằng service role (bỏ qua RLS) trong API.

-- =====================================================================
-- Quyền gọi RPC
-- =====================================================================
GRANT EXECUTE ON FUNCTION public.get_leaderboard(UUID, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
