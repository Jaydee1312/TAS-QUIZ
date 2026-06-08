import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { QuizOption } from "@/types";

interface QuestionInput {
  content: string;
  options: QuizOption[];
  correct_answer: string;
  explanation?: string | null;
}

interface QuizInput {
  title: string;
  description?: string | null;
  section?: string | null;
  pass_threshold?: number;
  time_limit_minutes?: number | null;
  allow_retake?: boolean;
  max_attempts?: number | null;
  points_on_retake?: boolean;
  top_n_for_bonus?: number;
  is_published?: boolean;
}

function validate(quiz: QuizInput, questions: QuestionInput[]): string | null {
  if (!quiz?.title?.trim()) return "Thiếu tiêu đề bài";
  if (!Array.isArray(questions) || questions.length === 0)
    return "Cần ít nhất 1 câu hỏi";
  for (const [i, q] of questions.entries()) {
    if (!q.content?.trim()) return `Câu ${i + 1}: thiếu nội dung`;
    if (!Array.isArray(q.options) || q.options.length < 2)
      return `Câu ${i + 1}: cần ít nhất 2 lựa chọn`;
    if (q.options.some((o) => !o.key?.trim() || !o.text?.trim()))
      return `Câu ${i + 1}: lựa chọn không được để trống`;
    if (!q.options.some((o) => o.key === q.correct_answer))
      return `Câu ${i + 1}: đáp án đúng không khớp lựa chọn nào`;
  }
  return null;
}

// POST /api/admin/quiz — tạo quiz mới + câu hỏi.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const body = (await request.json()) as {
    quiz: QuizInput;
    questions: QuestionInput[];
  };
  const err = validate(body.quiz, body.questions);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const service = createServiceClient();

  const { data: quiz, error: quizErr } = await service
    .from("quizzes")
    .insert({
      title: body.quiz.title.trim(),
      description: body.quiz.description ?? null,
      section: body.quiz.section ?? null,
      pass_threshold: body.quiz.pass_threshold ?? 80,
      time_limit_minutes: body.quiz.time_limit_minutes ?? null,
      allow_retake: body.quiz.allow_retake ?? true,
      max_attempts: body.quiz.max_attempts ?? null,
      points_on_retake: body.quiz.points_on_retake ?? false,
      top_n_for_bonus: body.quiz.top_n_for_bonus ?? 10,
      is_published: body.quiz.is_published ?? false,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (quizErr || !quiz) {
    return NextResponse.json({ error: "Không tạo được bài" }, { status: 500 });
  }

  const rows = body.questions.map((q, i) => ({
    quiz_id: quiz.id,
    content: q.content.trim(),
    order_index: i,
    options: q.options as unknown as object,
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? null,
  }));
  const { error: qErr } = await service.from("questions").insert(rows);
  if (qErr) {
    // rollback quiz nếu lỗi câu hỏi
    await service.from("quizzes").delete().eq("id", quiz.id);
    return NextResponse.json({ error: "Không lưu được câu hỏi" }, { status: 500 });
  }

  return NextResponse.json({ id: quiz.id });
}
