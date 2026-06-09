-- =====================================================================
-- TAS GLOBAL QUIZ — 0005 Câu hỏi chọn nhiều đáp án
-- Chạy SAU 0001..0004.
-- =====================================================================

-- Loại câu hỏi: 'single' (1 đáp án) hoặc 'multiple' (nhiều đáp án).
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'single'
  CHECK (question_type IN ('single', 'multiple'));

-- Với câu 'multiple', cột correct_answer lưu các key đúng nối bằng dấu phẩy,
-- ví dụ "A,C". Câu 'single' vẫn lưu 1 key như cũ ("B").
