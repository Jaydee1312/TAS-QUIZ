import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuizListItem } from "@/components/admin/quiz-list-item";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";
import type { Quiz } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const [{ data: quizzes }, { data: qRows }, { data: sRows }] = await Promise.all([
    supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
    supabase.from("questions").select("quiz_id"),
    supabase.from("submissions").select("quiz_id"),
  ]);
  const list = (quizzes ?? []) as Quiz[];

  const qCount = new Map<string, number>();
  for (const r of qRows ?? [])
    qCount.set(r.quiz_id, (qCount.get(r.quiz_id) ?? 0) + 1);
  const sCount = new Map<string, number>();
  for (const r of sRows ?? [])
    sCount.set(r.quiz_id, (sCount.get(r.quiz_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý bài trắc nghiệm</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/quizzes/import" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Import Excel
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/quizzes/new" className="gap-2">
              <Plus className="h-4 w-4" /> Tạo bài mới
            </Link>
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có bài nào. Bấm “Tạo bài mới” để bắt đầu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((quiz) => (
            <QuizListItem
              key={quiz.id}
              quiz={quiz}
              questionCount={qCount.get(quiz.id) ?? 0}
              submissionCount={sCount.get(quiz.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
