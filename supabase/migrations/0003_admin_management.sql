-- =====================================================================
-- TAS GLOBAL QUIZ — 0003 Admin management
-- Cho phép super admin (email trong ADMIN_EMAILS) cấp quyền admin cho người
-- khác qua giao diện. Chạy SAU 0001 + 0002.
-- =====================================================================

-- Danh sách email được cấp quyền admin (ngoài các super admin trong env).
-- Khi user đăng nhập, callback sẽ set role='admin' nếu email nằm ở đây.
CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email      TEXT PRIMARY KEY,
  added_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- Admin đọc được danh sách; thêm/xóa thực hiện bằng service role trong API
-- (đã kiểm tra super admin ở tầng app).
DROP POLICY IF EXISTS admin_allowlist_select ON public.admin_allowlist;
CREATE POLICY admin_allowlist_select ON public.admin_allowlist
  FOR SELECT USING (public.is_admin());
