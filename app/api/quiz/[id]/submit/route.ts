import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computeBasePoints, shouldAwardPoints } from "@/lib/points";
import { reconcileTopRanks } from "@/lib/ranking";
import { getPointsConfig } from "@/lib/settings";
import type { Quiz } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const quizId = params.id;

  // 1. Xác thực user.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // 2. Parse body.
  let body: { answers?: Record<string, string>; time_taken_seconds?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const answers = body.answers ?? {};
  const timeTaken = Math.max(0, Math.floor(body.time_taken_seconds ?? 0));

  // 3. Dùng service client cho thao tác chấm điểm + ghi điểm (bỏ qua RLS).
  const service = createServiceClient();

  const { data: quizRow, error: quizErr } = await service
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();
  if (quizErr || !quizRow) {
    return NextResponse.json({ error: "Không tìm thấy bài" }, { status: 404 });
  }
  const quiz = quizRow as Quiz;
  if (!quiz.is_published) {
    return NextResponse.json({ error: "Bài chưa được công bố" }, { status: 403 });
  }

  // 4. Lấy câu hỏi kèm đáp án đúng.
  const { data: questions } = await service
    .from("questions")
    .select("id, correct_answer")
    .eq("quiz_id", quizId);
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Bài chưa có câu hỏi" }, { status: 400 });
  }

  // 5. Kiểm tra số lần làm bài.
  const { data: prevSubs } = await service
    .from("submissions")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id);
  const attemptCount = prevSubs?.length ?? 0;
  const isFirstAttempt = attemptCount === 0;

  if (attemptCount > 0 && !quiz.allow_retake) {
    return NextResponse.json({ error: "Bài không cho làm lại" }, { status: 403 });
  }
  if (quiz.max_attempts !== null && attemptCount >= quiz.max_attempts) {
    return NextResponse.json(
      { error: "Đã hết số lần làm bài" },
      { status: 403 }
    );
  }

  // 6. Chấm điểm.
  const total = questions.length;
  let score = 0;
  for (const qq of questions) {
    if (answers[qq.id] && answers[qq.id] === qq.correct_answer) score += 1;
  }
  const percentage = Math.round((score / total) * 10000) / 100; // 2 chữ số thập phân

  // 7. Tính điểm thưởng cơ bản (mức điểm lấy từ cấu hình admin).
  const pointsConfig = await getPointsConfig(service);
  const awardPoints = shouldAwardPoints(quiz, isFirstAttempt);
  const base = computeBasePoints(quiz, percentage, awardPoints, pointsConfig);

  // 8. Ghi submission (points_earned tạm = base, cập nhật sau khi xét top).
  const { data: submission, error: subErr } = await service
    .from("submissions")
    .insert({
      user_id: user.id,
      quiz_id: quizId,
      score,
      total_questions: total,
      percentage,
      time_taken_seconds: timeTaken,
      answers,
      points_earned: base.total,
      attempt_number: attemptCount + 1,
      is_first_attempt: isFirstAttempt,
    })
    .select("id")
    .single();
  if (subErr || !submission) {
    return NextResponse.json(
      { error: "Không lưu được bài làm" },
      { status: 500 }
    );
  }

  // 9. Ghi lịch sử điểm cơ bản + cộng total_points.
  for (const item of base.breakdown) {
    await service.from("points_history").insert({
      user_id: user.id,
      submission_id: submission.id,
      type: item.type,
      points: item.points,
      reason: item.label,
      metadata: { quiz_id: quizId },
    });
  }
  if (base.total > 0) {
    await service.rpc("adjust_user_points" as never, {
      p_user_id: user.id,
      p_delta: base.total,
    } as never);
  }

  // 10. Đối chiếu top N realtime (cộng/trừ top_rank cho mọi user bị ảnh hưởng).
  const change = await reconcileTopRanks(service, quizId, quiz.top_n_for_bonus, {
    currentUserId: user.id,
    currentSubmissionId: submission.id,
    pointsPerTop: pointsConfig.topRank,
  });

  // 11. Nếu user hiện tại vừa lọt top → cộng vào points_earned của submission.
  let finalPoints = base.total;
  const gainedTop = change.gained.includes(user.id);
  if (gainedTop) {
    finalPoints += pointsConfig.topRank;
    await service
      .from("submissions")
      .update({ points_earned: finalPoints })
      .eq("id", submission.id);
  }

  return NextResponse.json({
    submission_id: submission.id,
    score,
    total,
    percentage,
    points_earned: finalPoints,
    gained_top: gainedTop,
  });
}
