import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types";

/** Danh sách email admin lấy từ env (phân tách bằng dấu phẩy). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
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
