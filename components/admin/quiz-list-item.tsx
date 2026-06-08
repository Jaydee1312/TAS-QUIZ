"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Trophy, Loader2 } from "lucide-react";
import type { Quiz } from "@/types";

export function QuizListItem({
  quiz,
  questionCount,
  submissionCount,
}: {
  quiz: Quiz;
  questionCount: number;
  submissionCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/quiz/${quiz.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Xóa thất bại");
      }
      toast.success("Đã xóa bài");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {quiz.section && <Badge variant="secondary">{quiz.section}</Badge>}
          {quiz.is_published ? (
            <Badge variant="success">Đã công bố</Badge>
          ) : (
            <Badge variant="outline">Nháp</Badge>
          )}
        </div>
        <p className="mt-1 truncate font-medium">{quiz.title}</p>
        <p className="text-xs text-muted-foreground">
          {questionCount} câu · {submissionCount} lượt nộp · Top{" "}
          {quiz.top_n_for_bonus}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href={`/leaderboard/${quiz.id}`}>
            <Trophy className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1">
          <Link href={`/admin/quizzes/${quiz.id}/edit`}>
            <Pencil className="h-4 w-4" /> Sửa
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa bài “{quiz.title}”?</DialogTitle>
            <DialogDescription>
              Toàn bộ câu hỏi và lượt nộp của bài này sẽ bị xóa vĩnh viễn. Không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
