"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, CheckCircle2, Target, Trophy, Medal, Crown } from "lucide-react";
import type { PointsConfig } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: PointsConfig }) {
  const router = useRouter();
  const [completion, setCompletion] = React.useState(String(initial.completion));
  const [highScore, setHighScore] = React.useState(String(initial.highScore));
  const [topRank, setTopRank] = React.useState(String(initial.topRank));
  const [rankTop1, setRankTop1] = React.useState(String(initial.rankTop1));
  const [rankTop3, setRankTop3] = React.useState(String(initial.rankTop3));
  const [rankTop5, setRankTop5] = React.useState(String(initial.rankTop5));
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points_completion: Number(completion),
          points_high_score: Number(highScore),
          points_top_rank: Number(topRank),
          points_rank_top1: Number(rankTop1),
          points_rank_top3: Number(rankTop3),
          points_rank_top5: Number(rankTop5),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại");
      toast.success("Đã cập nhật mức điểm");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle className="text-[19px]">Mức điểm thưởng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            label="Hoàn thành bài"
            desc="Cộng khi user nộp bài (bất kể đúng sai)."
            value={completion}
            onChange={setCompletion}
          />
          <Field
            icon={<Target className="h-5 w-5 text-primary" />}
            label="Đạt ngưỡng %"
            desc="Cộng khi % đúng ≥ ngưỡng của bài (ngưỡng chỉnh ở từng bài)."
            value={highScore}
            onChange={setHighScore}
          />
          <Field
            icon={<Trophy className="h-5 w-5 text-primary" />}
            label="Trong Top N của bài"
            desc="Cộng khi lọt vào top N (số N cấu hình ở từng bài). Rời top sẽ bị trừ lại."
            value={topRank}
            onChange={setTopRank}
          />

          <div className="rounded-xl border border-hairline p-4">
            <p className="text-[14px] font-medium">Thưởng thêm theo hạng cao</p>
            <p className="mb-3 text-[12px] text-muted-foreground">
              Để 0 = tắt. Mỗi người nhận mức <strong>cao nhất</strong> mà hạng
              của họ đạt được (không cộng dồn).
            </p>
            <div className="space-y-3">
              <Field
                icon={<Crown className="h-5 w-5 text-amber-500" />}
                label="Hạng 1"
                desc="Người đứng đầu bảng."
                value={rankTop1}
                onChange={setRankTop1}
              />
              <Field
                icon={<Medal className="h-5 w-5 text-zinc-500" />}
                label="Trong Top 3"
                desc="Hạng 1–3."
                value={rankTop3}
                onChange={setRankTop3}
              />
              <Field
                icon={<Medal className="h-5 w-5 text-amber-700" />}
                label="Trong Top 5"
                desc="Hạng 1–5."
                value={rankTop5}
                onChange={setRankTop5}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Mức điểm áp dụng cho các lần nộp bài <strong>kể từ sau khi lưu</strong>;
        điểm đã cộng trước đó không thay đổi.
      </p>
    </form>
  );
}

function Field({
  icon,
  label,
  desc,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-hairline p-4">
      <div className="flex gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <Label className="text-[15px]">{label}</Label>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-muted-foreground">+</span>
        <Input
          type="number"
          min={0}
          max={1000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-center"
        />
      </div>
    </div>
  );
}
