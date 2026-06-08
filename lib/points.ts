import type { Quiz } from "@/types";
import { DEFAULT_POINTS_CONFIG, type PointsConfig } from "@/lib/settings";

/** Mức điểm mặc định (fallback khi chưa có cấu hình). */
export const POINTS = {
  COMPLETION: DEFAULT_POINTS_CONFIG.completion,
  HIGH_SCORE: DEFAULT_POINTS_CONFIG.highScore,
  TOP_RANK: DEFAULT_POINTS_CONFIG.topRank,
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
 *  - +completion khi hoàn thành bài
 *  - +highScore  nếu percentage >= pass_threshold (mặc định 80%)
 *
 * Mức điểm lấy từ `config` (admin chỉnh được). `awardPoints=false` (vd: lần
 * làm lại mà quiz không cộng điểm) → trả 0.
 */
export function computeBasePoints(
  quiz: Pick<Quiz, "pass_threshold">,
  percentage: number,
  awardPoints: boolean,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): ComputedPoints {
  if (!awardPoints) return { total: 0, breakdown: [] };

  const breakdown: PointsBreakdownItem[] = [
    { type: "completion", points: config.completion, label: "Hoàn thành bài" },
  ];

  if (percentage >= quiz.pass_threshold) {
    breakdown.push({
      type: "high_score",
      points: config.highScore,
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
