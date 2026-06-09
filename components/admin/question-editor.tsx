"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Check } from "lucide-react";
import { cn, parseAnswerKeys } from "@/lib/utils";
import type { QuizOption, QuestionType } from "@/types";

export interface QuestionDraft {
  key: string; // key nội bộ React (không phải option key)
  content: string;
  options: QuizOption[];
  correct_answer: string; // single: "B"; multiple: "A,C"
  question_type: QuestionType;
  explanation: string;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface QuestionEditorProps {
  index: number;
  question: QuestionDraft;
  onChange: (q: QuestionDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionEditor({
  index,
  question,
  onChange,
  onRemove,
  canRemove,
}: QuestionEditorProps) {
  const isMultiple = question.question_type === "multiple";
  const correctKeys = parseAnswerKeys(question.correct_answer);

  function update(patch: Partial<QuestionDraft>) {
    onChange({ ...question, ...patch });
  }

  function setCorrect(keys: string[]) {
    const sorted = [...new Set(keys)].sort();
    update({ correct_answer: sorted.join(",") });
  }

  function toggleType(multiple: boolean) {
    if (multiple) {
      update({ question_type: "multiple" });
    } else {
      // Về single: chỉ giữ 1 đáp án đúng đầu tiên.
      update({
        question_type: "single",
        correct_answer: correctKeys[0] ?? "",
      });
    }
  }

  function pickSingle(key: string) {
    update({ correct_answer: key });
  }

  function toggleMulti(key: string) {
    const set = new Set(correctKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    setCorrect([...set]);
  }

  function updateOption(i: number, text: string) {
    const options = question.options.map((o, idx) =>
      idx === i ? { ...o, text } : o
    );
    update({ options });
  }

  function addOption() {
    if (question.options.length >= LETTERS.length) return;
    const key = LETTERS[question.options.length];
    update({ options: [...question.options, { key, text: "" }] });
  }

  function removeOption(i: number) {
    if (question.options.length <= 2) return;
    const survivors = question.options.filter((_, idx) => idx !== i);
    // old key → new key (đánh lại A,B,C... theo vị trí mới)
    const remap = new Map<string, string>();
    survivors.forEach((o, idx) => remap.set(o.key, LETTERS[idx]));
    const newOptions = survivors.map((o, idx) => ({
      key: LETTERS[idx],
      text: o.text,
    }));
    const newCorrect = correctKeys
      .map((k) => remap.get(k))
      .filter((k): k is string => Boolean(k));
    update({ options: newOptions, correct_answer: newCorrect.join(",") });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <GripVertical className="h-4 w-4" /> Câu {index + 1}
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nội dung câu hỏi</Label>
          <Textarea
            value={question.content}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Nhập nội dung câu hỏi…"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-hairline px-4 py-2.5">
          <div>
            <p className="text-[14px] font-medium">Cho phép chọn nhiều đáp án</p>
            <p className="text-[12px] text-muted-foreground">
              Bật nếu câu này có nhiều đáp án đúng (chấm đúng khi chọn đủ & đúng
              tất cả).
            </p>
          </div>
          <Switch checked={isMultiple} onCheckedChange={toggleType} />
        </div>

        <div className="space-y-2">
          <Label>
            Lựa chọn —{" "}
            {isMultiple ? "tích các đáp án đúng" : "chọn 1 đáp án đúng"}
          </Label>
          <div className="grid gap-2">
            {question.options.map((opt, i) => {
              const checked = correctKeys.includes(opt.key);
              return (
                <div key={opt.key} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      isMultiple ? toggleMulti(opt.key) : pickSingle(opt.key)
                    }
                    aria-label={`Đáp án đúng ${opt.key}`}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center border border-input transition-colors",
                      isMultiple ? "rounded-[5px]" : "rounded-full",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background"
                    )}
                  >
                    {checked &&
                      (isMultiple ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      ))}
                  </button>
                  <span className="w-5 font-semibold text-primary">{opt.key}</span>
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Lựa chọn ${opt.key}`}
                  />
                  {question.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {question.options.length < LETTERS.length && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Thêm lựa chọn
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Giải thích (tùy chọn)</Label>
          <Textarea
            value={question.explanation}
            onChange={(e) => update({ explanation: e.target.value })}
            placeholder="Giải thích đáp án (hiện ở trang kết quả)…"
            className="min-h-[60px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
