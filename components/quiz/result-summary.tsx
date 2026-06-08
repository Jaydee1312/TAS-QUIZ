import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDuration } from "@/lib/utils";
import { Zap, CheckCircle2, Trophy, Clock, Target } from "lucide-react";
import type { PointsHistory } from "@/types";

interface ResultSummaryProps {
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  pointsEarned: number;
  history: PointsHistory[];
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  completion: { label: "Hoàn thành bài", icon: <CheckCircle2 className="h-4 w-4" /> },
  high_score: { label: "Đạt điểm cao", icon: <Target className="h-4 w-4" /> },
  top_rank: { label: "Lọt top bảng xếp hạng", icon: <Trophy className="h-4 w-4" /> },
};

export function ResultSummary({
  score,
  total,
  percentage,
  timeTakenSeconds,
  pointsEarned,
  history,
}: ResultSummaryProps) {
  const passed = percentage >= 80;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className={cn("h-1.5 w-full", passed ? "bg-primary" : "bg-amber-500")} />
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">Kết quả của bạn</p>
          <div className="text-5xl font-extrabold">
            <span className={passed ? "text-primary" : "text-amber-600"}>
              {score}
            </span>
            <span className="text-muted-foreground">/{total}</span>
          </div>
          <div className="text-2xl font-semibold">{percentage}%</div>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDuration(timeTakenSeconds)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Zap className="h-4 w-4" /> +{pointsEarned} điểm
            </span>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-sm font-medium">Điểm thưởng nhận được</p>
            {history
              .filter((h) => h.points > 0)
              .map((h) => {
                const meta = TYPE_META[h.type] ?? {
                  label: h.reason ?? h.type,
                  icon: <Zap className="h-4 w-4" />,
                };
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-primary">{meta.icon}</span>
                      {meta.label}
                    </span>
                    <span className="font-semibold text-primary">+{h.points}</span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
