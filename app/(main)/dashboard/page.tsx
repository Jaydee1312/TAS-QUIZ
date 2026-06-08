import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, Zap, BookOpen } from "lucide-react";
import type { Quiz } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const supabase = createClient();

  // Gộp các truy vấn độc lập chạy song song để giảm độ trễ điều hướng.
  const [
    { data: quizzes },
    { data: subs },
    { data: questionRows },
    { count: higher },
  ] = await Promise.all([
    // Quiz đã publish (admin thấy cả chưa publish nhờ RLS).
    supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    // Submissions của user để xác định đã hoàn thành + điểm cao nhất.
    supabase.from("submissions").select("quiz_id, percentage").eq("user_id", user.id),
    // Đếm số câu hỏi mỗi quiz.
    supabase.from("questions").select("quiz_id"),
    // Xếp hạng tổng theo total_points.
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("total_points", user.total_points),
  ]);
  const overallRank = (higher ?? 0) + 1;

  const bestByQuiz = new Map<string, number>();
  for (const s of subs ?? []) {
    const cur = bestByQuiz.get(s.quiz_id) ?? -1;
    if (s.percentage > cur) bestByQuiz.set(s.quiz_id, s.percentage);
  }
  const countByQuiz = new Map<string, number>();
  for (const q of questionRows ?? []) {
    countByQuiz.set(q.quiz_id, (countByQuiz.get(q.quiz_id) ?? 0) + 1);
  }

  const list = (quizzes ?? []) as Quiz[];
  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm của bạn
            </CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">
              {user.total_points}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hạng tổng
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">#{overallRank}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bài đã làm
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{bestByQuiz.size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header + admin button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bài trắc nghiệm</h1>
          <p className="text-sm text-muted-foreground">
            Chọn một bài để bắt đầu làm và tích lũy điểm.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/admin/quizzes/new" className="gap-2">
              <Plus className="h-4 w-4" /> Tạo trắc nghiệm
            </Link>
          </Button>
        )}
      </div>

      {/* Quiz grid */}
      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có bài trắc nghiệm nào.
            {isAdmin && " Bấm “Tạo trắc nghiệm” để thêm bài đầu tiên."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              questionCount={countByQuiz.get(quiz.id) ?? 0}
              completed={bestByQuiz.has(quiz.id)}
              bestPercentage={bestByQuiz.get(quiz.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
