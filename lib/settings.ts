import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

/** Mức điểm thưởng (chỉnh được từ admin UI, lưu ở bảng app_settings). */
export interface PointsConfig {
  completion: number;
  highScore: number;
  topRank: number; // trong Top N của bài (top_n_for_bonus)
  rankTop1: number; // thêm cho hạng 1 (0 = tắt)
  rankTop3: number; // thêm cho hạng ≤ 3
  rankTop5: number; // thêm cho hạng ≤ 5
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  completion: 10,
  highScore: 5,
  topRank: 10,
  rankTop1: 0,
  rankTop3: 0,
  rankTop5: 0,
};

/** Đọc cấu hình mức điểm; nếu chưa có dòng cấu hình → dùng mặc định. */
export async function getPointsConfig(supabase: DB): Promise<PointsConfig> {
  const { data } = await supabase
    .from("app_settings")
    .select(
      "points_completion, points_high_score, points_top_rank, points_rank_top1, points_rank_top3, points_rank_top5"
    )
    .eq("id", 1)
    .maybeSingle();

  if (!data) return DEFAULT_POINTS_CONFIG;
  return {
    completion: data.points_completion,
    highScore: data.points_high_score,
    topRank: data.points_top_rank,
    rankTop1: data.points_rank_top1 ?? 0,
    rankTop3: data.points_rank_top3 ?? 0,
    rankTop5: data.points_rank_top5 ?? 0,
  };
}

/**
 * Điểm thưởng theo HẠNG (1-based) của một user trong bảng xếp hạng quiz.
 * Lấy mức CAO NHẤT trong các mốc mà hạng đó thỏa mãn:
 *  - hạng 1            → rankTop1
 *  - hạng ≤ 3          → rankTop3
 *  - hạng ≤ 5          → rankTop5
 *  - hạng ≤ topN (bài) → topRank
 */
export function rankBonus(
  rank: number,
  config: PointsConfig,
  quizTopN: number
): number {
  let b = 0;
  if (rank <= 1) b = Math.max(b, config.rankTop1);
  if (rank <= 3) b = Math.max(b, config.rankTop3);
  if (rank <= 5) b = Math.max(b, config.rankTop5);
  if (rank <= quizTopN) b = Math.max(b, config.topRank);
  return b;
}
