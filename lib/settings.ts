import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

/** Mức điểm thưởng (chỉnh được từ admin UI, lưu ở bảng app_settings). */
export interface PointsConfig {
  completion: number;
  highScore: number;
  topRank: number;
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  completion: 10,
  highScore: 5,
  topRank: 10,
};

/** Đọc cấu hình mức điểm; nếu chưa có dòng cấu hình → dùng mặc định. */
export async function getPointsConfig(supabase: DB): Promise<PointsConfig> {
  const { data } = await supabase
    .from("app_settings")
    .select("points_completion, points_high_score, points_top_rank")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return DEFAULT_POINTS_CONFIG;
  return {
    completion: data.points_completion,
    highScore: data.points_high_score,
    topRank: data.points_top_rank,
  };
}
