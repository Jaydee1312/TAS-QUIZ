import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

/**
 * OAuth callback của Supabase.
 * - Đổi `code` lấy session
 * - Đảm bảo row public.users tồn tại + set role='admin' nếu email nằm trong ADMIN_EMAILS
 * - Redirect về `redirectTo` (mặc định /dashboard)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Service client để đảm bảo row tồn tại + set role (bỏ qua RLS).
    const service = createServiceClient();
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const desiredRole: "admin" | "user" = isAdminEmail(user.email)
      ? "admin"
      : "user";
    const name = meta.full_name ?? meta.name ?? null;
    const avatarUrl = meta.avatar_url ?? meta.picture ?? null;

    const { data: existing } = await service
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      await service
        .from("users")
        .update({ email: user.email!, name, avatar_url: avatarUrl, role: desiredRole })
        .eq("id", user.id);
    } else {
      await service.from("users").insert({
        id: user.id,
        email: user.email!,
        name,
        avatar_url: avatarUrl,
        role: desiredRole,
      });
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
