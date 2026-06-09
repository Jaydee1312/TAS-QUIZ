"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  QuestionEditor,
  type QuestionDraft,
} from "@/components/admin/question-editor";
import { Loader2, Plus, Save } from "lucide-react";
import type { Question, Quiz } from "@/types";

let uid = 0;
const newKey = () => `q_${Date.now()}_${uid++}`;

function blankQuestion(): QuestionDraft {
  return {
    key: newKey(),
    content: "",
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    correct_answer: "",
    question_type: "single",
    explanation: "",
  };
}

interface QuizFormProps {
  /** Nếu có → chế độ chỉnh sửa. */
  quiz?: Quiz;
  questions?: Question[];
}

export function QuizForm({ quiz, questions }: QuizFormProps) {
  const router = useRouter();
  const editing = Boolean(quiz);

  const [title, setTitle] = React.useState(quiz?.title ?? "");
  const [description, setDescription] = React.useState(quiz?.description ?? "");
  const [section, setSection] = React.useState(quiz?.section ?? "");
  const [passThreshold, setPassThreshold] = React.useState(
    quiz?.pass_threshold ?? 80
  );
  const [timeLimit, setTimeLimit] = React.useState<string>(
    quiz?.time_limit_minutes != null ? String(quiz.time_limit_minutes) : ""
  );
  const [allowRetake, setAllowRetake] = React.useState(quiz?.allow_retake ?? true);
  const [maxAttempts, setMaxAttempts] = React.useState<string>(
    quiz?.max_attempts != null ? String(quiz.max_attempts) : "3"
  );
  const [pointsOnRetake, setPointsOnRetake] = React.useState(
    quiz?.points_on_retake ?? false
  );
  const [topN, setTopN] = React.useState(quiz?.top_n_for_bonus ?? 10);
  const [isPublished, setIsPublished] = React.useState(quiz?.is_published ?? false);

  const [items, setItems] = React.useState<QuestionDraft[]>(() => {
    if (questions && questions.length > 0) {
      return questions
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => ({
          key: newKey(),
          content: q.content,
          options: q.options,
          correct_answer: q.correct_answer,
          question_type: q.question_type ?? "single",
          explanation: q.explanation ?? "",
        }));
    }
    return [blankQuestion()];
  });

  const [saving, setSaving] = React.useState(false);

  function updateItem(i: number, q: QuestionDraft) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? q : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, blankQuestion()]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      quiz: {
        title,
        description: description || null,
        section: section || null,
        pass_threshold: Number(passThreshold) || 80,
        time_limit_minutes: timeLimit ? Number(timeLimit) : null,
        allow_retake: allowRetake,
        max_attempts: maxAttempts ? Number(maxAttempts) : null,
        points_on_retake: pointsOnRetake,
        top_n_for_bonus: Number(topN) || 10,
        is_published: isPublished,
      },
      questions: items.map((q) => ({
        content: q.content,
        options: q.options,
        correct_answer: q.correct_answer,
        question_type: q.question_type ?? "single",
        explanation: q.explanation || null,
      })),
    };

    try {
      const url = editing ? `/api/admin/quiz/${quiz!.id}` : "/api/admin/quiz";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại");
      toast.success(editing ? "Đã cập nhật bài" : "Đã tạo bài");
      router.push("/admin/quizzes");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Thông tin chung */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin bài</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra Buổi 1 — Tổng quan Marketing"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="VD: BUỔI 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Ngưỡng đạt (% để +5 điểm)</Label>
              <Input
                id="pass"
                type="number"
                min={0}
                max={100}
                value={passThreshold}
                onChange={(e) => setPassThreshold(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về bài kiểm tra…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cấu hình */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="time">Thời gian (phút, trống = không giới hạn)</Label>
              <Input
                id="time"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="vd: 15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topn">Top N được thưởng</Label>
              <Input
                id="topn"
                type="number"
                min={1}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Số lần tối đa (trống = vô hạn)</Label>
              <Input
                id="max"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                disabled={!allowRetake}
                placeholder="vd: 3"
              />
            </div>
          </div>

          <ToggleRow
            label="Cho phép làm lại"
            desc="User có thể làm lại bài này nhiều lần."
            checked={allowRetake}
            onChange={setAllowRetake}
          />
          <ToggleRow
            label="Cộng điểm khi làm lại"
            desc="Lần làm thứ 2 trở đi có cộng điểm cơ bản không."
            checked={pointsOnRetake}
            onChange={setPointsOnRetake}
            disabled={!allowRetake}
          />
          <ToggleRow
            label="Công bố (publish)"
            desc="Bật để user nhìn thấy và làm được bài."
            checked={isPublished}
            onChange={setIsPublished}
          />
        </CardContent>
      </Card>

      {/* Câu hỏi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Câu hỏi ({items.length})</h2>
          <Button type="button" variant="outline" onClick={addItem} className="gap-1">
            <Plus className="h-4 w-4" /> Thêm câu
          </Button>
        </div>
        {items.map((q, i) => (
          <QuestionEditor
            key={q.key}
            index={i}
            question={q}
            onChange={(nq) => updateItem(i, nq)}
            onRemove={() => removeItem(i)}
            canRemove={items.length > 1}
          />
        ))}
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background/80 py-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {editing ? "Lưu thay đổi" : "Tạo bài"}
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
