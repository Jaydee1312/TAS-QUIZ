import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LeaderboardRow } from "@/types";
import { DEFAULT_POINTS_CONFIG, rankBonus, type PointsConfig } from "@/lib/settings";

type DB = SupabaseClient<Database>;

/**
 * Lấy bảng xếp hạng của một quiz (best submission mỗi user),
 * sắp xếp theo percentage DESC, time_taken_seconds ASC.
 * Dùng RPC `get_leaderboard` (SECURITY DEFINER) để chỉ trả về cột an toàn.
 */
export async function getLeaderboard(
  supabase: DB,
  quizId: string,
  limit = 25
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard" as never, {
    p_quiz_id: quizId,
    p_limit: limit,
  } as never);

  if (error) throw error;
  return (data ?? []) as unknown as LeaderboardRow[];
}

interface RankedUser {
  user_id: string;
  percentage: number;
  time_taken_seconds: number;
  submitted_at: string;
}

/** Best submission mỗi user, đã sắp xếp theo luật ranking. */
async function getRankedUsers(supabase: DB, quizId: string): Promise<RankedUser[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("user_id, percentage, time_taken_seconds, submitted_at")
    .eq("quiz_id", quizId)
    .order("percentage", { ascending: false })
    .order("time_taken_seconds", { ascending: true })
    .order("submitted_at", { ascending: true });

  if (error) throw error;

  // Giữ submission tốt nhất cho mỗi user (lần xuất hiện đầu tiên do đã sort).
  const seen = new Set<string>();
  const ranked: RankedUser[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    ranked.push(row as RankedUser);
  }
  return ranked;
}

/** Bonus theo hạng mà mỗi user ĐANG giữ (net của top_rank/top_rank_lost cho quiz). */
async function getHeldBonuses(supabase: DB, quizId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("points_history")
    .select("user_id, points, type, metadata")
    .in("type", ["top_rank", "top_rank_lost"]);

  if (error) throw error;

  const net = new Map<string, number>();
  for (const row of data ?? []) {
    const meta = (row.metadata ?? {}) as { quiz_id?: string };
    if (meta.quiz_id !== quizId) continue;
    net.set(row.user_id, (net.get(row.user_id) ?? 0) + row.points);
  }
  return net;
}

interface ReconcileOptions {
  /** User vừa nộp bài (để link submission_id khi họ lọt top). */
  currentUserId?: string;
  currentSubmissionId?: string;
  /** Mức điểm thưởng (admin chỉnh được). */
  config?: PointsConfig;
}

/**
 * Đối chiếu lại thưởng theo hạng của một quiz và cập nhật điểm theo thời gian
 * thực. Hỗ trợ nhiều mốc (hạng 1 / top 3 / top 5 / trong top N).
 *
 * Cách làm: với mỗi user, tính mức bonus MONG MUỐN theo hạng hiện tại, so với
 * mức ĐANG giữ (net lịch sử), rồi ghi đúng phần chênh lệch (delta). Nhờ vậy
 * việc lên/xuống hạng, vào/ra top đều được điều chỉnh chính xác.
 *
 * Trả về map { user_id → delta điểm vừa thay đổi } để API biết bonus của lần
 * nộp hiện tại. Dùng service client (bỏ qua RLS) khi gọi từ API.
 */
export async function reconcileTopRanks(
  supabase: DB,
  quizId: string,
  topN: number,
  opts: ReconcileOptions = {}
): Promise<Map<string, number>> {
  const config = opts.config ?? DEFAULT_POINTS_CONFIG;
  const ranked = await getRankedUsers(supabase, quizId);
  const held = await getHeldBonuses(supabase, quizId);

  // Mức mong muốn theo hạng hiện tại.
  const desired = new Map<string, number>();
  ranked.forEach((r, i) => {
    const bonus = rankBonus(i + 1, config, topN);
    if (bonus > 0) desired.set(r.user_id, bonus);
  });

  // Cần xét: ai đang có mong muốn > 0, và ai đang giữ bonus (để hạ về đúng mức).
  const userIds = new Set<string>([...desired.keys(), ...held.keys()]);
  const deltas = new Map<string, number>();

  for (const userId of userIds) {
    const want = desired.get(userId) ?? 0;
    const have = held.get(userId) ?? 0;
    const delta = want - have;
    if (delta === 0) continue;
    deltas.set(userId, delta);

    const isGain = delta > 0;
    const submissionId =
      isGain && userId === opts.currentUserId
        ? opts.currentSubmissionId ?? null
        : null;

    await supabase.from("points_history").insert({
      user_id: userId,
      submission_id: submissionId,
      type: isGain ? "top_rank" : "top_rank_lost",
      points: delta,
      reason: isGain ? "Cập nhật thưởng theo hạng" : "Tụt hạng / rời top",
      metadata: { quiz_id: quizId },
    });
    await supabase.rpc("adjust_user_points" as never, {
      p_user_id: userId,
      p_delta: delta,
    } as never);
  }

  return deltas;
}
