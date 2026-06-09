import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

function toPoint(v: unknown): number | null {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
  return n;
}

// POST /api/admin/settings — cập nhật mức điểm thưởng toàn hệ thống.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;

  const completion = toPoint(body.points_completion);
  const highScore = toPoint(body.points_high_score);
  const topRank = toPoint(body.points_top_rank);
  const rankTop1 = toPoint(body.points_rank_top1);
  const rankTop3 = toPoint(body.points_rank_top3);
  const rankTop5 = toPoint(body.points_rank_top5);

  if (
    [completion, highScore, topRank, rankTop1, rankTop3, rankTop5].some(
      (v) => v === null
    )
  ) {
    return NextResponse.json(
      { error: "Mức điểm phải là số nguyên từ 0 đến 1000" },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  const { error } = await service
    .from("app_settings")
    .update({
      points_completion: completion!,
      points_high_score: highScore!,
      points_top_rank: topRank!,
      points_rank_top1: rankTop1!,
      points_rank_top3: rankTop3!,
      points_rank_top5: rankTop5!,
    })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: "Lưu thất bại" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
