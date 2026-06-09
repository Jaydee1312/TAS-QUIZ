"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuizTimer } from "@/components/quiz/quiz-timer";
import { Loader2, ChevronLeft, ChevronRight, Send, Check } from "lucide-react";
import { cn, parseAnswerKeys } from "@/lib/utils";
import type { PublicQuestion, Quiz } from "@/types";

interface QuizRunnerProps {
  quiz: Quiz;
  questions: PublicQuestion[];
  attemptNumber: number;
}

export function QuizRunner({ quiz, questions, attemptNumber }: QuizRunnerProps) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [current, setCurrent] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const submittedRef = React.useRef(false);

  const limitSeconds = quiz.time_limit_minutes
    ? quiz.time_limit_minutes * 60
    : null;

  // Đồng hồ đếm.
  React.useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const answeredCount = Object.keys(answers).length;
  const total = questions.length;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;
  const q = questions[current];

  function selectAnswer(questionId: string, key: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  }

  // Câu chọn nhiều đáp án: bật/tắt 1 key, lưu dạng "A,C" (đã sắp xếp).
  function toggleMulti(questionId: string, key: string) {
    setAnswers((prev) => {
      const set = new Set(parseAnswerKeys(prev[questionId]));
      if (set.has(key)) set.delete(key);
      else set.add(key);
      const joined = [...set].sort().join(",");
      const next = { ...prev };
      if (joined) next[questionId] = joined;
      else delete next[questionId];
      return next;
    });
  }

  const doSubmit = React.useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      try {
        const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            time_taken_seconds: elapsed,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Nộp bài thất bại");
        }
        if (auto) toast.info("Hết giờ — bài đã được nộp tự động.");
        router.push(`/quiz/${quiz.id}/result/${data.submission_id}`);
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    },
    [answers, elapsed, quiz.id, router]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            {quiz.section && (
              <p className="text-sm text-primary">{quiz.section}</p>
            )}
            <h1 className="text-xl font-semibold">{quiz.title}</h1>
          </div>
          <QuizTimer
            limitSeconds={limitSeconds}
            elapsed={elapsed}
            onTimeUp={() => doSubmit(true)}
          />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Đã trả lời {answeredCount}/{total} câu · Lần làm thứ {attemptNumber}
        </p>
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium leading-relaxed">
            <span className="mr-2 text-primary">Câu {current + 1}.</span>
            {q.content}
          </CardTitle>
          {q.question_type === "multiple" && (
            <p className="text-[13px] text-muted-foreground">
              (Có thể chọn nhiều đáp án)
            </p>
          )}
        </CardHeader>
        <CardContent>
          {q.question_type === "multiple" ? (
            <div className="grid gap-3">
              {q.options.map((opt) => {
                const selected = parseAnswerKeys(answers[q.id]).includes(opt.key);
                return (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => toggleMulti(q.id, opt.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary/60",
                      selected && "border-primary bg-primary/10"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="font-semibold text-primary">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <RadioGroup
              value={answers[q.id] ?? ""}
              onValueChange={(v) => selectAnswer(q.id, v)}
              className="gap-3"
            >
              {q.options.map((opt) => {
                const selected = answers[q.id] === opt.key;
                return (
                  <label
                    key={opt.key}
                    htmlFor={`${q.id}-${opt.key}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/60",
                      selected && "border-primary bg-primary/10"
                    )}
                  >
                    <RadioGroupItem value={opt.key} id={`${q.id}-${opt.key}`} />
                    <span className="font-semibold text-primary">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Trước
        </Button>

        {current < total - 1 ? (
          <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="gap-1">
            Tiếp <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => setConfirmOpen(true)} disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" /> Nộp bài
          </Button>
        )}
      </div>

      {/* Lưới câu hỏi để nhảy nhanh */}
      <div className="flex flex-wrap gap-2">
        {questions.map((qq, i) => {
          const answered = answers[qq.id] !== undefined;
          return (
            <button
              key={qq.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-9 w-9 rounded-md border text-sm font-medium transition-colors",
                i === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : answered
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp bài?</DialogTitle>
            <DialogDescription>
              Bạn đã trả lời {answeredCount}/{total} câu.
              {answeredCount < total &&
                " Các câu chưa trả lời sẽ bị tính là sai."}{" "}
              Sau khi nộp sẽ không thể chỉnh sửa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Quay lại
            </Button>
            <Button onClick={() => doSubmit(false)} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận nộp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
