import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { ImportQuiz } from "@/lib/quiz-import";

// POST /api/admin/quiz/import — tạo hàng loạt bài từ dữ liệu Excel đã parse.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = (await request.json()) as { quizzes?: ImportQuiz[] };
  const quizzes = body.quizzes ?? [];
  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return NextResponse.json({ error: "Không có bài nào để tạo" }, { status: 400 });
  }

  const service = createServiceClient();
  const created: { title: string; id: string }[] = [];
  const failed: { title: string; error: string }[] = [];

  for (const item of quizzes) {
    // Validate tối thiểu (client đã validate, nhưng check lại server-side).
    if (!item.quiz?.title?.trim() || !item.questions?.length) {
      failed.push({
        title: item.quiz?.title ?? "(không tên)",
        error: "Thiếu tiêu đề hoặc câu hỏi",
      });
      continue;
    }
    const invalid = item.questions.some(
      (q) =>
        !q.content?.trim() ||
        !Array.isArray(q.options) ||
        q.options.length < 2 ||
        !q.options.some((o) => o.key === q.correct_answer)
    );
    if (invalid) {
      failed.push({ title: item.quiz.title, error: "Câu hỏi không hợp lệ" });
      continue;
    }

    const { data: quiz, error: quizErr } = await service
      .from("quizzes")
      .insert({
        title: item.quiz.title.trim(),
        description: item.quiz.description ?? null,
        section: item.quiz.section ?? null,
        pass_threshold: item.quiz.pass_threshold ?? 80,
        time_limit_minutes: item.quiz.time_limit_minutes ?? null,
        allow_retake: item.quiz.allow_retake ?? true,
        max_attempts: item.quiz.max_attempts ?? null,
        points_on_retake: item.quiz.points_on_retake ?? false,
        top_n_for_bonus: item.quiz.top_n_for_bonus ?? 10,
        is_published: item.quiz.is_published ?? false,
        created_by: admin.id,
      })
      .select("id")
      .single();

    if (quizErr || !quiz) {
      failed.push({ title: item.quiz.title, error: "Không tạo được bài" });
      continue;
    }

    const rows = item.questions.map((q, i) => ({
      quiz_id: quiz.id,
      content: q.content.trim(),
      order_index: i,
      options: q.options as unknown as object,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
    }));
    const { error: qErr } = await service.from("questions").insert(rows);
    if (qErr) {
      await service.from("quizzes").delete().eq("id", quiz.id);
      failed.push({ title: item.quiz.title, error: "Không lưu được câu hỏi" });
      continue;
    }

    created.push({ title: item.quiz.title, id: quiz.id });
  }

  return NextResponse.json({ created, failed });
}
