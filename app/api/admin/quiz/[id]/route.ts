import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { parseAnswerKeys } from "@/lib/utils";
import type { QuizOption, QuestionType } from "@/types";

interface QuestionInput {
  content: string;
  options: QuizOption[];
  correct_answer: string;
  question_type?: QuestionType;
  explanation?: string | null;
}

// PUT /api/admin/quiz/[id] — cập nhật quiz + thay toàn bộ câu hỏi.
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = await request.json();
  const quiz = body.quiz;
  const questions = body.questions as QuestionInput[];

  if (!quiz?.title?.trim())
    return NextResponse.json({ error: "Thiếu tiêu đề" }, { status: 400 });
  if (!Array.isArray(questions) || questions.length === 0)
    return NextResponse.json({ error: "Cần ít nhất 1 câu hỏi" }, { status: 400 });
  for (const [i, q] of questions.entries()) {
    const keys = parseAnswerKeys(q.correct_answer);
    if (
      keys.length === 0 ||
      keys.some((k) => !q.options?.some((o) => o.key === k))
    )
      return NextResponse.json(
        { error: `Câu ${i + 1}: đáp án đúng không hợp lệ` },
        { status: 400 }
      );
  }

  const service = createServiceClient();

  const { error: upErr } = await service
    .from("quizzes")
    .update({
      title: quiz.title.trim(),
      description: quiz.description ?? null,
      section: quiz.section ?? null,
      pass_threshold: quiz.pass_threshold ?? 80,
      time_limit_minutes: quiz.time_limit_minutes ?? null,
      allow_retake: quiz.allow_retake ?? true,
      max_attempts: quiz.max_attempts ?? null,
      points_on_retake: quiz.points_on_retake ?? false,
      top_n_for_bonus: quiz.top_n_for_bonus ?? 10,
      is_published: quiz.is_published ?? false,
    })
    .eq("id", params.id);
  if (upErr) return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });

  // Thay toàn bộ câu hỏi.
  await service.from("questions").delete().eq("quiz_id", params.id);
  const rows = questions.map((q, i) => ({
    quiz_id: params.id,
    content: q.content.trim(),
    order_index: i,
    options: q.options as unknown as object,
    correct_answer: parseAnswerKeys(q.correct_answer).join(","),
    question_type: q.question_type === "multiple" ? "multiple" : "single",
    explanation: q.explanation ?? null,
  }));
  const { error: qErr } = await service.from("questions").insert(rows);
  if (qErr) return NextResponse.json({ error: "Lưu câu hỏi thất bại" }, { status: 500 });

  return NextResponse.json({ id: params.id });
}

// DELETE /api/admin/quiz/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const service = createServiceClient();
  const { error } = await service.from("quizzes").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
