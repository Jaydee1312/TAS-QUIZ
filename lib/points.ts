import type { Quiz } from "@/types";

export const POINTS = {
  COMPLETION: 10,
  HIGH_SCORE: 5,
  TOP_RANK: 10,
} as const;

export interface PointsBreakdownItem {
  type: "completion" | "high_score" | "top_rank";
  points: number;
  label: string;
}

export interface ComputedPoints {
  total: number;
  breakdown: PointsBreakdownItem[];
}

/**
 * Tính điểm thưởng cho một lần nộp bài (CHƯA gồm top rank — top rank xử lý
 * riêng trong ranking.ts vì cần biết thứ hạng sau khi đã ghi submission).
 *
 * Quy tắc:
 *  - +10 khi hoàn thành bài
 *  - +5  nếu percentage >= pass_threshold (mặc định 80%)
 *
 * `awardPoints=false` (vd: lần làm lại mà quiz không cộng điểm) → trả 0.
 */
export function computeBasePoints(
  quiz: Pick<Quiz, "pass_threshold">,
  percentage: number,
  awardPoints: boolean
): ComputedPoints {
  if (!awardPoints) return { total: 0, breakdown: [] };

  const breakdown: PointsBreakdownItem[] = [
    { type: "completion", points: POINTS.COMPLETION, label: "Hoàn thành bài" },
  ];

  if (percentage >= quiz.pass_threshold) {
    breakdown.push({
      type: "high_score",
      points: POINTS.HIGH_SCORE,
      label: `Đạt ≥ ${quiz.pass_threshold}%`,
    });
  }

  const total = breakdown.reduce((sum, b) => sum + b.points, 0);
  return { total, breakdown };
}

/**
 * Quyết định một lần nộp bài có được cộng điểm không.
 *  - Lần đầu (attempt 1): luôn được cộng
 *  - Lần làm lại: chỉ cộng nếu quiz.points_on_retake = true
 */
export function shouldAwardPoints(
  quiz: Pick<Quiz, "points_on_retake">,
  isFirstAttempt: boolean
): boolean {
  return isFirstAttempt || quiz.points_on_retake;
}
