import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatDuration, getInitials } from "@/lib/utils";
import { Zap, History } from "lucide-react";
import type { PointsHistory, Quiz, Submission } from "@/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  completion: "Hoàn thành bài",
  high_score: "Đạt điểm cao",
  top_rank: "Lọt top",
  top_rank_lost: "Rớt khỏi top",
  admin_adjust: "Admin điều chỉnh",
};

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  const supabase = createClient();

  const [{ data: subRows }, { data: historyRows }] = await Promise.all([
    supabase
      .from("submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("points_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const submissions = (subRows ?? []) as Submission[];
  const history = (historyRows ?? []) as PointsHistory[];

  // Tên quiz cho hiển thị.
  const quizIds = Array.from(new Set(submissions.map((s) => s.quiz_id)));
  const { data: quizRows } = quizIds.length
    ? await supabase.from("quizzes").select("id, title").in("id", quizIds)
    : { data: [] as Pick<Quiz, "id" | "title">[] };
  const quizTitle = new Map<string, string>();
  for (const q of quizRows ?? []) quizTitle.set(q.id, q.title);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hồ sơ */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name ?? user.email} />
            ) : null}
            <AvatarFallback className="text-lg">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-semibold">{user.name ?? "Người dùng"}</h1>
              {user.role === "admin" && <Badge>Admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-3xl font-extrabold text-primary">
              <Zap className="h-6 w-6" /> {user.total_points}
            </div>
            <p className="text-xs text-muted-foreground">tổng điểm</p>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử bài làm */}
      <Card>
        <CardHeader>
          <CardTitle>Bài đã làm ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn chưa làm bài nào.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <Link
                  key={s.id}
                  href={`/quiz/${s.quiz_id}/result/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-secondary/40"
                >
                  <div>
                    <p className="font-medium">
                      {quizTitle.get(s.quiz_id) ?? "Bài trắc nghiệm"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.submitted_at)} · {formatDuration(s.time_taken_seconds)} · lần {s.attempt_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {s.score}/{s.total_questions} ({s.percentage}%)
                    </span>
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3 text-primary" />+{s.points_earned}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử điểm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Lịch sử điểm
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có giao dịch điểm.</p>
          ) : (
            <div className="space-y-1">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                >
                  <div>
                    <p>{TYPE_LABEL[h.type] ?? h.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.reason} · {formatDate(h.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      h.points >= 0 ? "text-primary" : "text-destructive"
                    )}
                  >
                    {h.points >= 0 ? "+" : ""}
                    {h.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
