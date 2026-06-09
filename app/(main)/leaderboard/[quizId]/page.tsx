import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/ranking";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Trophy } from "lucide-react";
import type { Quiz } from "@/types";

export const dynamic = "force-dynamic";

export default async function QuizLeaderboardPage({
  params,
}: {
  params: { quizId: string };
}) {
  const user = (await getCurrentUser())!;
  const supabase = createClient();

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.quizId)
    .single();
  if (!quizRow) notFound();
  const quiz = quizRow as Quiz;

  const rows = await getLeaderboard(supabase, params.quizId, quiz.top_n_for_bonus);

  // Chỉ admin / super admin thấy nút xóa (không tự xóa mình — xử lý trong table).
  const viewerIsAdmin = user.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link href="/leaderboard">
          <ChevronLeft className="h-4 w-4" /> Tất cả bảng xếp hạng
        </Link>
      </Button>

      <div className="flex items-start gap-3">
        <Trophy className="mt-1 h-7 w-7 text-primary" />
        <div>
          <div className="flex items-center gap-2">
            {quiz.section && <Badge variant="secondary">{quiz.section}</Badge>}
            <Badge variant="outline">Top {quiz.top_n_for_bonus}</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Xếp theo % đúng cao nhất, rồi đến thời gian nhanh nhất. Cập nhật theo
            thời gian thực.
          </p>
        </div>
      </div>

      <LeaderboardTable
        quizId={params.quizId}
        initialRows={rows}
        currentUserId={user.id}
        limit={quiz.top_n_for_bonus}
        viewerIsAdmin={viewerIsAdmin}
      />
    </div>
  );
}
