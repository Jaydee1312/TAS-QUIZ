import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/user/[id]/points — admin cộng/trừ điểm thủ công.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const body = (await request.json()) as { delta?: number; reason?: string };
  const delta = Math.trunc(body.delta ?? 0);
  if (!delta) {
    return NextResponse.json({ error: "Số điểm không hợp lệ" }, { status: 400 });
  }

  const service = createServiceClient();

  const { error: histErr } = await service.from("points_history").insert({
    user_id: params.id,
    submission_id: null,
    type: "admin_adjust",
    points: delta,
    reason: body.reason?.trim() || `Admin điều chỉnh (${admin.email})`,
    metadata: { admin_id: admin.id },
  });
  if (histErr) {
    return NextResponse.json({ error: "Ghi lịch sử thất bại" }, { status: 500 });
  }

  await service.rpc("adjust_user_points" as never, {
    p_user_id: params.id,
    p_delta: delta,
  } as never);

  const { data: updated } = await service
    .from("users")
    .select("total_points")
    .eq("id", params.id)
    .single();

  return NextResponse.json({ total_points: updated?.total_points ?? null });
}
