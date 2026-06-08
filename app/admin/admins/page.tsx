import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getAdminEmails, isSuperAdmin } from "@/lib/auth";
import { AdminManager, type AdminEntry } from "@/components/admin/admin-manager";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdmin(user.email)) redirect("/admin");

  const supabase = createClient();

  // Tất cả user đang là admin (đã đăng nhập).
  const { data: adminUsers } = await supabase
    .from("users")
    .select("email, name, avatar_url, role")
    .eq("role", "admin");

  // Danh sách allowlist (admin được cấp qua UI).
  const { data: allowRows } = await supabase
    .from("admin_allowlist")
    .select("email, note");

  const superEmails = getAdminEmails();
  const byEmail = new Map<string, AdminEntry>();

  // Super admin từ env (luôn hiển thị, không gỡ được).
  for (const email of superEmails) {
    byEmail.set(email, {
      email,
      name: null,
      avatar_url: null,
      isSuper: true,
      pending: false,
      note: null,
    });
  }

  // Allowlist (admin do super admin thêm).
  for (const row of allowRows ?? []) {
    if (byEmail.has(row.email)) continue;
    byEmail.set(row.email, {
      email: row.email,
      name: null,
      avatar_url: null,
      isSuper: false,
      pending: true, // sẽ chuyển false nếu khớp user đã đăng nhập
      note: row.note,
    });
  }

  // Khớp thông tin từ user đã đăng nhập.
  for (const u of adminUsers ?? []) {
    const existing = byEmail.get(u.email);
    if (existing) {
      existing.name = u.name;
      existing.avatar_url = u.avatar_url;
      existing.pending = false;
    } else {
      // Admin trong DB nhưng không thuộc env/allowlist (vd: cấp tay) — vẫn hiện.
      byEmail.set(u.email, {
        email: u.email,
        name: u.name,
        avatar_url: u.avatar_url,
        isSuper: false,
        pending: false,
        note: null,
      });
    }
  }

  const entries = Array.from(byEmail.values()).sort((a, b) => {
    if (a.isSuper !== b.isSuper) return a.isSuper ? -1 : 1;
    return a.email.localeCompare(b.email);
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight-apple">
            Quản lý admin
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Cấp hoặc gỡ quyền admin cho người khác. Chỉ super admin thấy trang
            này.
          </p>
        </div>
      </div>

      <AdminManager entries={entries} />
    </div>
  );
}
