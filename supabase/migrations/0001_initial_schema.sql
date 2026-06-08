-- =====================================================================
-- TAS GLOBAL QUIZ — 0001 Initial schema
-- Chạy file này TRƯỚC trong SQL Editor của Supabase.
-- =====================================================================

-- ---------- users (mở rộng từ auth.users) ----------
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  total_points INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- quizzes ----------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT,
  section            TEXT,
  pass_threshold     INT NOT NULL DEFAULT 80,
  time_limit_minutes INT,
  allow_retake       BOOLEAN NOT NULL DEFAULT TRUE,
  max_attempts       INT,
  points_on_retake   BOOLEAN NOT NULL DEFAULT FALSE,
  top_n_for_bonus    INT NOT NULL DEFAULT 10,
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- questions ----------
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  order_index    INT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- submissions ----------
CREATE TABLE IF NOT EXISTS public.submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id            UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score              INT NOT NULL,
  total_questions    INT NOT NULL,
  percentage         NUMERIC(5,2) NOT NULL,
  time_taken_seconds INT NOT NULL,
  answers            JSONB NOT NULL,
  points_earned      INT NOT NULL DEFAULT 0,
  attempt_number     INT NOT NULL,
  is_first_attempt   BOOLEAN NOT NULL,
  submitted_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- points_history ----------
CREATE TABLE IF NOT EXISTS public.points_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('completion','high_score','top_rank','top_rank_lost','admin_adjust')),
  points        INT NOT NULL,
  reason        TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_submissions_quiz_ranking
  ON public.submissions(quiz_id, percentage DESC, time_taken_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_submissions_user
  ON public.submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_user
  ON public.points_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_quiz
  ON public.questions(quiz_id, order_index ASC);

-- =====================================================================
-- Functions & triggers
-- =====================================================================

-- Tự tạo row public.users khi có user mới trong auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cập nhật updated_at tự động.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS quizzes_set_updated_at ON public.quizzes;
CREATE TRIGGER quizzes_set_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Cộng/trừ điểm tổng một cách atomic.
CREATE OR REPLACE FUNCTION public.adjust_user_points(p_user_id UUID, p_delta INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET total_points = GREATEST(0, total_points + p_delta)
  WHERE id = p_user_id;
END;
$$;

-- Bảng xếp hạng: best submission mỗi user, chỉ trả về cột an toàn (không lộ answers).
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_quiz_id UUID, p_limit INT DEFAULT 25)
RETURNS TABLE (
  rank               BIGINT,
  user_id            UUID,
  name               TEXT,
  avatar_url         TEXT,
  score              INT,
  total_questions    INT,
  percentage         NUMERIC,
  time_taken_seconds INT,
  submitted_at       TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best AS (
    SELECT DISTINCT ON (s.user_id)
      s.user_id,
      s.score,
      s.total_questions,
      s.percentage,
      s.time_taken_seconds,
      s.submitted_at
    FROM public.submissions s
    WHERE s.quiz_id = p_quiz_id
    ORDER BY s.user_id, s.percentage DESC, s.time_taken_seconds ASC, s.submitted_at ASC
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY b.percentage DESC, b.time_taken_seconds ASC, b.submitted_at ASC) AS rank,
    b.user_id,
    u.name,
    u.avatar_url,
    b.score,
    b.total_questions,
    b.percentage,
    b.time_taken_seconds,
    b.submitted_at
  FROM best b
  JOIN public.users u ON u.id = b.user_id
  ORDER BY b.percentage DESC, b.time_taken_seconds ASC, b.submitted_at ASC
  LIMIT p_limit;
$$;
