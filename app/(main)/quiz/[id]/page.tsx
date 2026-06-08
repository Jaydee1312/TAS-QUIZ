import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { PublicQuestion, Quiz, QuizOption } from "@/types";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const user = (await getCurrentUser())!;
  const supabase = createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!quiz) notFound();
  const typedQuiz = quiz as Quiz;

  // Số lần đã nộp.
  const { data: prevSubs } = await supabase
    .from("submissions")
    .select("id, submitted_at")
    .eq("quiz_id", params.id)
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false });

  const attemptCount = prevSubs?.length ?? 0;
  const lastSubmissionId = prevSubs?.[0]?.id;

  // Kiểm tra quyền làm bài.
  const retakeBlocked = attemptCount > 0 && !typedQuiz.allow_retake;
  const maxReached =
    typedQuiz.max_attempts !== null && attemptCount >= typedQuiz.max_attempts;

  if (retakeBlocked || maxReached) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Không thể làm lại
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {retakeBlocked
                ? "Bài này không cho phép làm lại."
                : `Bạn đã dùng hết số lần làm bài cho phép (${typedQuiz.max_attempts} lần).`}
            </p>
            <div className="flex flex-wrap gap-3">
              {lastSubmissionId && (
                <Button asChild>
                  <Link href={`/quiz/${params.id}/result/${lastSubmissionId}`}>
                    Xem kết quả gần nhất
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={`/leaderboard/${params.id}`}>Xem bảng xếp hạng</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Về trang chính</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lấy câu hỏi — KHÔNG select correct_answer / explanation để tránh lộ đáp án.
  const { data: questions } = await supabase
    .from("questions")
    .select("id, quiz_id, content, order_index, options, created_at")
    .eq("quiz_id", params.id)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Bài này chưa có câu hỏi nào.
          </CardContent>
        </Card>
      </div>
    );
  }

  const publicQuestions: PublicQuestion[] = questions.map((qrow) => ({
    id: qrow.id,
    quiz_id: qrow.quiz_id,
    content: qrow.content,
    order_index: qrow.order_index,
    options: qrow.options as unknown as QuizOption[],
    created_at: qrow.created_at,
  }));

  return (
    <QuizRunner
      quiz={typedQuiz}
      questions={publicQuestions}
      attemptNumber={attemptCount + 1}
    />
  );
}
