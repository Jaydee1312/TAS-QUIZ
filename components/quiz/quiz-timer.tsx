"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

interface QuizTimerProps {
  /** Tổng giây cho phép. Nếu null → đếm lên (không giới hạn). */
  limitSeconds: number | null;
  /** Giây đã trôi qua hiện tại (controlled từ parent). */
  elapsed: number;
  onTimeUp?: () => void;
}

export function QuizTimer({ limitSeconds, elapsed, onTimeUp }: QuizTimerProps) {
  const remaining = limitSeconds !== null ? limitSeconds - elapsed : null;
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (remaining !== null && remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onTimeUp?.();
    }
  }, [remaining, onTimeUp]);

  const danger = remaining !== null && remaining <= 30;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium tabular-nums",
        danger && "border-destructive text-destructive"
      )}
    >
      <Clock className="h-4 w-4" />
      {remaining !== null
        ? formatDuration(Math.max(0, remaining))
        : formatDuration(elapsed)}
    </div>
  );
}
