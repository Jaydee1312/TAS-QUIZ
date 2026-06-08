"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { QuizOption } from "@/types";

export interface QuestionDraft {
  key: string; // key nội bộ React (không phải option key)
  content: string;
  options: QuizOption[];
  correct_answer: string;
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
  function update(patch: Partial<QuestionDraft>) {
    onChange({ ...question, ...patch });
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
    // Bỏ option và đánh lại key A,B,C...
    const options = question.options
      .filter((_, idx) => idx !== i)
      .map((o, idx) => ({ key: LETTERS[idx], text: o.text }));
    const removedKey = question.options[i].key;
    const correct =
      question.correct_answer === removedKey
        ? ""
        : // map lại correct nếu key dịch chuyển
          options.find(
            (o) =>
              o.text ===
              question.options.find((x) => x.key === question.correct_answer)
                ?.text
          )?.key ?? "";
    update({ options, correct_answer: correct });
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

        <div className="space-y-2">
          <Label>Lựa chọn (chọn radio = đáp án đúng)</Label>
          <RadioGroup
            value={question.correct_answer}
            onValueChange={(v) => update({ correct_answer: v })}
            className="gap-2"
          >
            {question.options.map((opt, i) => (
              <div key={opt.key} className="flex items-center gap-3">
                <RadioGroupItem value={opt.key} id={`${question.key}-${opt.key}`} />
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
            ))}
          </RadioGroup>
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
