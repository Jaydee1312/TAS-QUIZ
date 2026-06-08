# TAS GLOBAL QUIZ

Website làm bài kiểm tra trắc nghiệm với hệ thống tích lũy điểm thưởng, đăng
nhập Google, và bảng xếp hạng realtime cho từng bài.

## ✨ Tính năng

- 🔐 **Đăng nhập Google OAuth** (qua Supabase)
- 📝 **Làm bài trắc nghiệm**: timer, lưới câu hỏi, nộp bài → chấm điểm ngay
- ✅ **Xem đáp án + giải thích** chi tiết từng câu sau khi nộp
- 💎 **Điểm thưởng tích lũy**:
  - +10 điểm khi hoàn thành bài
  - +5 điểm nếu đúng ≥ ngưỡng (mặc định 80%)
  - +10 điểm nếu lọt **top N** của bài (mặc định top 10) — **realtime**: vào top
    được +10, bị đẩy ra khỏi top bị trừ -10
- 🏆 **Leaderboard realtime** mỗi bài (xếp theo % đúng → thời gian nhanh nhất)
- 👤 **Hồ sơ cá nhân**: tổng điểm, lịch sử bài làm, lịch sử điểm
- 🛠️ **Admin panel**: tạo / sửa / xóa bài, cấu hình làm lại, công bố, quản lý
  người dùng + điều chỉnh điểm thủ công

## 🧱 Tech Stack

- **Next.js 14** (App Router) + **TypeScript** + **TailwindCSS** + UI theo phong
  cách **shadcn/ui**
- **Supabase** (PostgreSQL + Auth + Realtime + RLS)
- Deploy **Vercel**

## 🚀 Setup nhanh

> Claude không thể tự tạo tài khoản Supabase / Google Cloud. Bạn cần làm các
> bước thủ công bên dưới.

### 1. Tạo Supabase project

1. Vào <https://supabase.com> → New Project (đặt tên `tas-global-quiz`, region
   Singapore).
2. Vào **Settings → API**, lấy `Project URL`, `anon key`, `service_role key`.

### 2. Chạy SQL migrations

Vào **SQL Editor** của Supabase và chạy lần lượt:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. (tùy chọn) `supabase/seed.sql` — thêm 2 bài mẫu để test ngay.

### 3. Bật Realtime cho leaderboard

Vào **Database → Replication** (hoặc **Realtime**) → bật replication cho bảng
`public.submissions`. Nhờ vậy bảng xếp hạng tự cập nhật khi có người nộp bài.

### 4. Setup Google OAuth

1. <https://console.cloud.google.com> → tạo project → **APIs & Services →
   Credentials → Create OAuth 2.0 Client ID** (Web application).
2. **Authorized redirect URI**:
   `https://<your-project>.supabase.co/auth/v1/callback`
3. Copy **Client ID + Secret**.
4. Trong Supabase: **Authentication → Providers → Google** → enable + dán
   credentials.
5. Trong **Authentication → URL Configuration**, thêm Site URL
   (`http://localhost:3000` khi dev, và domain Vercel khi production) vào
   **Redirect URLs**.

### 5. Biến môi trường

Copy `.env.example` → `.env.local` và điền:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=pdanh025@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Mọi email trong `ADMIN_EMAILS` sẽ tự được set `role='admin'` khi đăng nhập.

### 6. Chạy local

```bash
npm install
npm run dev
```

Mở <http://localhost:3000>.

### 7. Deploy Vercel

1. Push code lên GitHub.
2. <https://vercel.com> → Import project.
3. Thêm đúng các env vars như `.env.local` (đổi `NEXT_PUBLIC_SITE_URL` thành
   domain Vercel).
4. Deploy. Nhớ thêm domain Vercel vào **Redirect URLs** của Supabase.

## 📁 Cấu trúc chính

```
app/                # routes (App Router)
  (auth)/           # login + OAuth callback
  (main)/           # dashboard, quiz, leaderboard, profile (yêu cầu đăng nhập)
  admin/            # khu vực admin (yêu cầu role=admin)
  api/              # route handlers: nộp bài, CRUD quiz, chỉnh điểm
components/         # ui/ (shadcn-style), quiz/, admin/, leaderboard/, layout/
lib/                # supabase clients, points.ts, ranking.ts, auth.ts, utils.ts
types/              # database.ts (schema) + index.ts (app types)
supabase/           # migrations + seed
middleware.ts       # refresh session + bảo vệ route + check admin
```

## 🧠 Logic điểm & ranking

- `lib/points.ts` — tính điểm cơ bản (hoàn thành / đạt ngưỡng), quy tắc cộng
  điểm khi làm lại (`points_on_retake`).
- `lib/ranking.ts` — `getLeaderboard()` (qua RPC `get_leaderboard`,
  best-submission mỗi user) và `reconcileTopRanks()` xử lý cộng/trừ bonus top
  realtime, kể cả edge case "bị đẩy ra khỏi top" (`points_history.type =
  top_rank_lost`, điểm âm).
- Việc cộng/trừ điểm + ghi `points_history` chạy server-side bằng
  `service_role` (bỏ qua RLS) trong API `/api/quiz/[id]/submit`.

## 🔒 Bảo mật

- Trang làm bài **không gửi `correct_answer` xuống client** — chấm điểm hoàn
  toàn ở server.
- RLS bật cho mọi bảng; user chỉ đọc dữ liệu của mình + quiz đã publish; admin
  thấy tất cả.
- API admin kiểm tra `role='admin'` ở server (không chỉ ẩn UI).
