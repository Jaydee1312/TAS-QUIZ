"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatDuration, formatDate, getInitials } from "@/lib/utils";
import { Crown, Medal, Trash2, Loader2 } from "lucide-react";
import type { LeaderboardRow } from "@/types";

interface LeaderboardTableProps {
  quizId: string;
  initialRows: LeaderboardRow[];
  currentUserId: string;
  limit?: number;
  viewerIsAdmin?: boolean;
  viewerIsSuper?: boolean;
  adminUserIds?: string[];
  superUserIds?: string[];
}

export function LeaderboardTable({
  quizId,
  initialRows,
  currentUserId,
  limit = 10,
  viewerIsAdmin = false,
  viewerIsSuper = false,
  adminUserIds = [],
  superUserIds = [],
}: LeaderboardTableProps) {
  const [rows, setRows] = React.useState<LeaderboardRow[]>(initialRows);
  const [target, setTarget] = React.useState<LeaderboardRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const adminSet = React.useMemo(() => new Set(adminUserIds), [adminUserIds]);
  const superSet = React.useMemo(() => new Set(superUserIds), [superUserIds]);

  function canDelete(row: LeaderboardRow): boolean {
    if (!viewerIsAdmin) return false;
    if (row.user_id === currentUserId) return false; // không tự xóa mình
    if (superSet.has(row.user_id)) return false; // không xóa super admin
    if (adminSet.has(row.user_id)) return viewerIsSuper; // admin: chỉ super xóa
    return true; // user thường: admin nào cũng xóa được
  }

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/leaderboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId, user_id: target.user_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xóa thất bại");
      setRows((prev) => prev.filter((r) => r.user_id !== target.user_id));
      toast.success("Đã xóa khỏi bảng xếp hạng");
      setTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  }

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
            {viewerIsAdmin && <th className="w-12 px-2 py-3" />}
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
                {viewerIsAdmin && (
                  <td className="px-2 py-3 text-right">
                    {canDelete(row) && (
                      <button
                        onClick={() => setTarget(row)}
                        aria-label="Xóa khỏi bảng xếp hạng"
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <Dialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa khỏi bảng xếp hạng?</DialogTitle>
            <DialogDescription>
              Toàn bộ lượt nộp của <strong>{target?.name ?? "người này"}</strong>{" "}
              ở bài này sẽ bị xóa và điểm thưởng từ bài này được hoàn lại. Không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex items-center gap-1 font-semibold text-amber-500">
        <Crown className="h-4 w-4" /> 1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex items-center gap-1 font-semibold text-zinc-500">
        <Medal className="h-4 w-4" /> 2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex items-center gap-1 font-semibold text-amber-700">
        <Medal className="h-4 w-4" /> 3
      </span>
    );
  return <span className="font-medium text-muted-foreground">{rank}</span>;
}
