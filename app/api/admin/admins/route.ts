import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSuperAdmin, isSuperAdmin } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/admin/admins — super admin cấp quyền admin cho 1 email.
export async function POST(request: Request) {
  const sa = await requireSuperAdmin();
  if (!sa) return NextResponse.json({ error: "Chỉ super admin" }, { status: 403 });

  const body = (await request.json()) as { email?: string; note?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }
  if (isSuperAdmin(email)) {
    return NextResponse.json(
      { error: "Email này đã là super admin" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Thêm vào allowlist (upsert để không lỗi nếu đã có).
  const { error: insErr } = await service
    .from("admin_allowlist")
    .upsert(
      { email, added_by: sa.id, note: body.note?.trim() || null },
      { onConflict: "email" }
    );
  if (insErr) {
    return NextResponse.json({ error: "Không lưu được" }, { status: 500 });
  }

  // Nếu user đã từng đăng nhập → nâng quyền ngay. Nếu chưa, callback sẽ tự set
  // khi họ đăng nhập lần đầu.
  await service.from("users").update({ role: "admin" }).eq("email", email);

  return NextResponse.json({ ok: true, email });
}

// DELETE /api/admin/admins — gỡ quyền admin của 1 email.
export async function DELETE(request: Request) {
  const sa = await requireSuperAdmin();
  if (!sa) return NextResponse.json({ error: "Chỉ super admin" }, { status: 403 });

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
  }
  if (isSuperAdmin(email)) {
    return NextResponse.json(
      { error: "Không thể gỡ quyền của super admin" },
      { status: 400 }
    );
  }

  const service = createServiceClient();
  await service.from("admin_allowlist").delete().eq("email", email);
  // Hạ quyền user (nếu đã tồn tại) về 'user'.
  await service.from("users").update({ role: "user" }).eq("email", email);

  return NextResponse.json({ ok: true, email });
}
