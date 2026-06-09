import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getAdminEmails, isSuperAdmin } from "@/lib/auth";
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

  // Thông tin phân quyền xóa (chỉ admin mới thấy nút xóa).
  const viewerIsAdmin = user.role === "admin";
  const viewerIsSuper = isSuperAdmin(user.email);
  let adminUserIds: string[] = [];
  let superUserIds: string[] = [];
  if (viewerIsAdmin && rows.length > 0) {
    const ids = rows.map((r) => r.user_id);
    const { data: roleRows } = await supabase
      .from("users")
      .select("id, email, role")
      .in("id", ids);
    const superEmails = getAdminEmails();
    adminUserIds = (roleRows ?? [])
      .filter((u) => u.role === "admin")
      .map((u) => u.id);
    superUserIds = (roleRows ?? [])
      .filter((u) => superEmails.includes(u.email.toLowerCase()))
      .map((u) => u.id);
  }

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
        viewerIsSuper={viewerIsSuper}
        adminUserIds={adminUserIds}
        superUserIds={superUserIds}
      />
    </div>
  );
}
