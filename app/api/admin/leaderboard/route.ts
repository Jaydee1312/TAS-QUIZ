import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, isSuperAdmin } from "@/lib/auth";
import { getPointsConfig } from "@/lib/settings";
import { reconcileTopRanks } from "@/lib/ranking";

/**
 * DELETE /api/admin/leaderboard — xóa 1 người khỏi bảng xếp hạng của 1 bài.
 * Xóa toàn bộ lượt nộp của họ ở bài đó + hoàn lại điểm bài đó, rồi tính lại top.
 *
 * Phân quyền:
 *  - Admin thường: chỉ xóa được user thường.
 *  - Super admin: xóa được cả admin.
 *  - Không ai xóa được super admin.
 */
export async function DELETE(request: Request) {
  const viewer = await requireAdmin();
  if (!viewer) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = (await request.json()) as { quiz_id?: string; user_id?: string };
  const quizId = body.quiz_id;
  const targetId = body.user_id;
  if (!quizId || !targetId) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const service = createServiceClient();

  // Thông tin người bị xóa.
  const { data: target } = await service
    .from("users")
    .select("role, email")
    .eq("id", targetId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
  }

  // Kiểm tra phân quyền.
  const viewerIsSuper = isSuperAdmin(viewer.email);
  if (isSuperAdmin(target.email)) {
    return NextResponse.json(
      { error: "Không thể xóa super admin khỏi bảng xếp hạng" },
      { status: 403 }
    );
  }
  if (target.role === "admin" && !viewerIsSuper) {
    return NextResponse.json(
      { error: "Chỉ super admin mới xóa được admin" },
      { status: 403 }
    );
  }

  // Hoàn lại điểm của bài này (tổng points_history có metadata.quiz_id = quizId).
  const { data: history } = await service
    .from("points_history")
    .select("id, points, metadata")
    .eq("user_id", targetId);

  let refund = 0;
  const historyIds: string[] = [];
  for (const row of history ?? []) {
    const meta = (row.metadata ?? {}) as { quiz_id?: string };
    if (meta.quiz_id !== quizId) continue;
    refund += row.points;
    historyIds.push(row.id);
  }

  if (historyIds.length > 0) {
    await service.from("points_history").delete().in("id", historyIds);
  }
  await service
    .from("submissions")
    .delete()
    .eq("quiz_id", quizId)
    .eq("user_id", targetId);

  if (refund !== 0) {
    await service.rpc("adjust_user_points" as never, {
      p_user_id: targetId,
      p_delta: -refund,
    } as never);
  }

  // Tính lại top của bài (người khác có thể vào top nhờ chỗ trống).
  const { data: quiz } = await service
    .from("quizzes")
    .select("top_n_for_bonus")
    .eq("id", quizId)
    .maybeSingle();
  if (quiz) {
    const config = await getPointsConfig(service);
    await reconcileTopRanks(service, quizId, quiz.top_n_for_bonus, { config });
  }

  return NextResponse.json({ ok: true });
}
