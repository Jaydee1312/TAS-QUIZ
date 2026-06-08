"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDuration, formatDate, getInitials } from "@/lib/utils";
import { Crown, Medal } from "lucide-react";
import type { LeaderboardRow } from "@/types";

interface LeaderboardTableProps {
  quizId: string;
  initialRows: LeaderboardRow[];
  currentUserId: string;
  limit?: number;
}

export function LeaderboardTable({
  quizId,
  initialRows,
  currentUserId,
  limit = 10,
}: LeaderboardTableProps) {
  const [rows, setRows] = React.useState<LeaderboardRow[]>(initialRows);

  // Realtime: lắng nghe thay đổi trên submissions của quiz này → refetch.
  React.useEffect(() => {
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase.rpc("get_leaderboard" as never, {
        p_quiz_id: quizId,
        p_limit: limit,
      } as never);
      if (data) setRows(data as unknown as LeaderboardRow[]);
    }

    const channel = supabase
      .channel(`leaderboard:${quizId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `quiz_id=eq.${quizId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, limit]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
        Chưa có ai hoàn thành bài này. Hãy là người đầu tiên!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-muted-foreground">
          <tr>
            <th className="w-16 px-4 py-3 text-left font-medium">Hạng</th>
            <th className="px-4 py-3 text-left font-medium">Người chơi</th>
            <th className="px-4 py-3 text-right font-medium">Điểm</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Thời gian
            </th>
            <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
              Ngày nộp
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMe = row.user_id === currentUserId;
            return (
              <tr
                key={row.user_id}
                className={cn(
                  "border-t border-border transition-colors",
                  isMe ? "bg-primary/10" : "hover:bg-secondary/30"
                )}
              >
                <td className="px-4 py-3">
                  <RankBadge rank={Number(row.rank)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {row.avatar_url ? (
                        <AvatarImage src={row.avatar_url} alt={row.name ?? ""} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(row.name, null)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {row.name ?? "Ẩn danh"}
                      {isMe && (
                        <span className="ml-2 text-xs text-primary">(bạn)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {row.score}/{row.total_questions}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({row.percentage}%)
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {formatDuration(row.time_taken_seconds)}
                </td>
                <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">
                  {formatDate(row.submitted_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center gap-1 font-bold text-yellow-400">
        <Crown className="h-4 w-4" /> 1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center gap-1 font-bold text-zinc-300">
        <Medal className="h-4 w-4" /> 2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center gap-1 font-bold text-amber-600">
        <Medal className="h-4 w-4" /> 3
      </span>
    );
  return <span className="font-medium text-muted-foreground">{rank}</span>;
}
