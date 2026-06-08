import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Supabase client cho Server Components / Route Handlers (đọc cookie phiên). */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Được gọi từ Server Component — bỏ qua, middleware sẽ refresh session.
          }
        },
      },
    }
  );
}

/**
 * Client dùng service role key — bỏ qua RLS.
 * CHỈ dùng trong server-side (API routes) cho các thao tác cộng điểm / cập nhật ranking.
 */
export function createServiceClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
