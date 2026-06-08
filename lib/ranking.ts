import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LeaderboardRow } from "@/types";
import { POINTS } from "@/lib/points";

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

/** Tập user_id hiện đang giữ bonus top_rank của quiz (net điểm > 0). */
async function getCurrentTopHolders(supabase: DB, quizId: string): Promise<Set<string>> {
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

  const holders = new Set<string>();
  for (const [userId, total] of net.entries()) {
    if (total > 0) holders.add(userId);
  }
  return holders;
}

export interface TopRankChange {
  gained: string[]; // user vừa vào top → +10
  lost: string[]; // user vừa rớt khỏi top → -10
}

interface ReconcileOptions {
  /** User vừa nộp bài (để link submission_id khi họ lọt top). */
  currentUserId?: string;
  currentSubmissionId?: string;
}

/**
 * Đối chiếu lại top N của quiz sau khi có submission mới và cập nhật điểm
 * thưởng top_rank theo thời gian thực:
 *  - User mới lọt vào top N mà chưa từng nhận bonus → +10 (top_rank)
 *  - User đang giữ bonus nhưng bị đẩy ra khỏi top N → -10 (top_rank_lost)
 *
 * Trả về thay đổi để API biết bonus của submission hiện tại.
 * Dùng service client (bỏ qua RLS) khi gọi từ API.
 */
export async function reconcileTopRanks(
  supabase: DB,
  quizId: string,
  topN: number,
  opts: ReconcileOptions = {}
): Promise<TopRankChange> {
  const ranked = await getRankedUsers(supabase, quizId);
  const topSet = new Set(ranked.slice(0, topN).map((r) => r.user_id));
  const holders = await getCurrentTopHolders(supabase, quizId);

  const gained: string[] = [];
  const lost: string[] = [];

  // Ai trong top mà chưa giữ bonus → cộng.
  for (const userId of topSet) {
    if (!holders.has(userId)) gained.push(userId);
  }
  // Ai đang giữ bonus mà không còn trong top → trừ.
  for (const userId of holders) {
    if (!topSet.has(userId)) lost.push(userId);
  }

  // Ghi points_history + cập nhật total_points (atomic qua RPC).
  for (const userId of gained) {
    // Chỉ link submission_id cho chính user vừa nộp bài.
    const submissionId =
      userId === opts.currentUserId ? opts.currentSubmissionId ?? null : null;
    await supabase.from("points_history").insert({
      user_id: userId,
      submission_id: submissionId,
      type: "top_rank",
      points: POINTS.TOP_RANK,
      reason: `Lọt vào top ${topN}`,
      metadata: { quiz_id: quizId },
    });
    await supabase.rpc("adjust_user_points" as never, {
      p_user_id: userId,
      p_delta: POINTS.TOP_RANK,
    } as never);
  }

  for (const userId of lost) {
    await supabase.from("points_history").insert({
      user_id: userId,
      submission_id: null,
      type: "top_rank_lost",
      points: -POINTS.TOP_RANK,
      reason: `Bị đẩy ra khỏi top ${topN}`,
      metadata: { quiz_id: quizId },
    });
    await supabase.rpc("adjust_user_points" as never, {
      p_user_id: userId,
      p_delta: -POINTS.TOP_RANK,
    } as never);
  }

  return { gained, lost };
}
