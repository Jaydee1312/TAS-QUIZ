import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { ResultSummary } from "@/components/quiz/result-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Trophy, RotateCcw, Home } from "lucide-react";
import type {
  PointsHistory,
  Question,
  Quiz,
  QuizOption,
  Submission,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: { id: string; subId: string };
}) {
  const user = (await getCurrentUser())!;
  const supabase = createClient();

  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", params.subId)
    .single();

  // RLS đảm bảo chỉ chủ sở hữu / admin đọc được; chặn thêm ở app.
  if (!sub || sub.quiz_id !== params.id) notFound();
  const submission = sub as Submission;

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!quizRow) notFound();
  const quiz = quizRow as Quiz;

  const { data: questionRows } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("order_index", { ascending: true });
  const questions = (questionRows ?? []) as Question[];

  const { data: historyRows } = await supabase
    .from("points_history")
    .select("*")
    .eq("submission_id", params.subId);
  const history = (historyRows ?? []) as PointsHistory[];

  const userAnswers = submission.answers as Record<string, string>;
  const canRetake =
    quiz.allow_retake &&
    (quiz.max_attempts === null || submission.attempt_number < quiz.max_attempts);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        {quiz.section && <p className="text-sm text-primary">{quiz.section}</p>}
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <p className="text-sm text-muted-foreground">
          Lần làm thứ {submission.attempt_number}
          {!submission.is_first_attempt && !quiz.points_on_retake && (
            <> · Lần làm lại không cộng điểm cơ bản</>
          )}
        </p>
      </div>

      <ResultSummary
        score={submission.score}
        total={submission.total_questions}
        percentage={submission.percentage}
        timeTakenSeconds={submission.time_taken_seconds}
        pointsEarned={submission.points_earned}
        history={history}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link href={`/leaderboard/${params.id}`}>
            <Trophy className="h-4 w-4" /> Xem bảng xếp hạng
          </Link>
        </Button>
        {canRetake && (
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/quiz/${params.id}`}>
              <RotateCcw className="h-4 w-4" /> Làm lại
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" /> Về trang chính
          </Link>
        </Button>
      </div>

      {/* Review từng câu */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Chi tiết đáp án</h2>
        {questions.map((q, i) => {
          const options = q.options as unknown as QuizOption[];
          const userAns = userAnswers[q.id] ?? null;
          const correct = userAns === q.correct_answer;
          return (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-medium leading-relaxed">
                    <span className="mr-2 text-muted-foreground">
                      Câu {i + 1}.
                    </span>
                    {q.content}
                  </CardTitle>
                  {correct ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Đúng
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0 gap-1">
                      <XCircle className="h-3 w-3" /> Sai
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {options.map((opt) => {
                  const isCorrect = opt.key === q.correct_answer;
                  const isUserPick = opt.key === userAns;
                  return (
                    <div
                      key={opt.key}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border p-3 text-sm",
                        isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                        isUserPick &&
                          !isCorrect &&
                          "border-destructive/50 bg-destructive/10"
                      )}
                    >
                      <span className="font-semibold">{opt.key}.</span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {isUserPick && !isCorrect && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  );
                })}
                {!userAns && (
                  <p className="text-xs text-muted-foreground">
                    Bạn chưa trả lời câu này.
                  </p>
                )}
                {q.explanation && (
                  <div className="mt-2 rounded-md bg-secondary/40 p-3 text-sm">
                    <span className="font-medium text-primary">Giải thích: </span>
                    {q.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
