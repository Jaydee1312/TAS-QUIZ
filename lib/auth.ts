import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types";

/** Danh sách email super admin lấy từ env (phân tách bằng dấu phẩy). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Super admin = email cố định trong env ADMIN_EMAILS.
 * Chỉ super admin mới được quản lý (thêm/xóa) admin khác.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** Tương thích ngược: dùng cho check super admin trong callback/env. */
export const isAdminEmail = isSuperAdmin;

/**
 * Email có được cấp quyền admin không = super admin (env) HOẶC nằm trong
 * bảng admin_allowlist. Dùng service client để bỏ qua RLS (gọi từ callback).
 */
export async function isAuthorizedAdminEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  if (isSuperAdmin(email)) return true;
  const service = createServiceClient();
  const { data } = await service
    .from("admin_allowlist")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

/**
 * Lấy profile của user đang đăng nhập (từ bảng public.users).
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return profile as AppUser;
}

export async function requireAdmin(): Promise<AppUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

/** Yêu cầu super admin (env) — cho các thao tác quản lý admin. */
export async function requireSuperAdmin(): Promise<AppUser | null> {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.email)) return null;
  return user;
}
