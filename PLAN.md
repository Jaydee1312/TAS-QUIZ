# 📋 TAS GLOBAL QUIZ — KẾ HOẠCH PHÁT TRIỂN

> Tài liệu này lưu **toàn bộ context, yêu cầu, và quyết định thiết kế** đã thống nhất với user. Nếu Claude chuyển session khác, đọc file này là đủ để tiếp tục.

---

## 🎯 1. Mô tả dự án

Website làm bài kiểm tra trắc nghiệm, tương tự website khóa **Fullstack Marketing** đợt trước của user (xem ảnh tham khảo trong tin nhắn đầu tiên), nhưng:

**Lược bỏ:** Video record, slide, tài liệu — KHÔNG cần các mục này.

**Giữ lại:** Phần làm bài trắc nghiệm (BÀI KIỂM TRA).

**Bổ sung mới:**
1. Đăng nhập Google OAuth (giống Twin / 1Prompt)
2. Nộp bài → hiện điểm + đáp án đúng cho từng câu
3. Hệ thống lưu trữ và tích lũy điểm thưởng

---

## ✅ 2. Yêu cầu đã chốt với user

| Mục | Quyết định |
|---|---|
| **Tên website** | TAS GLOBAL QUIZ |
| **Tech stack** | Next.js 14 + TypeScript + TailwindCSS + shadcn/ui + Supabase |
| **Auth** | Google OAuth qua Supabase |
| **Email admin** | `pdanh025@gmail.com` (hardcode trong `.env`) |
| **Theme** | Dark theme (nền đen, accent teal/cyan giống website cũ) |
| **Deploy** | Vercel free (`*.vercel.app`) |
| **Top 10** | Tính riêng cho **mỗi quiz** |
| **Trao điểm top** | **Realtime** (mỗi lần nộp xong cập nhật ngay) |
| **Cho làm lại bài** | Admin tự cài đặt cho mỗi quiz (toggle on/off + số lần + có cộng điểm lần 2 không) |
| **Top 25 trong tương lai** | Có thể mở rộng từ 10 → 25 (làm 10 trước, để config dễ đổi) |

---

## 💎 3. Logic điểm thưởng

Mỗi lần user nộp bài, hệ thống cộng điểm dựa trên 3 quy tắc:

1. **+10 điểm** — Hoàn thành bài (bất kể đúng/sai bao nhiêu)
2. **+5 điểm** — Nếu `percentage >= 80%`
3. **+10 điểm** — Nếu lọt top 10 của quiz đó
   - Cách xếp hạng: `ORDER BY percentage DESC, time_taken_seconds ASC`
   - Realtime: ngay khi có người mới vào top 10 thì cộng +10; người bị đẩy ra khỏi top thì TRỪ -10
   - **Lưu ý:** Cần xử lý cẩn thận edge case "đẩy ra khỏi top" — ghi vào `points_history` với type `top_rank_lost` (points âm)

### Setting per-quiz (admin cấu hình):
- ☑️ `allow_retake`: Cho phép làm lại không
- 🔢 `max_attempts`: Số lần tối đa (NULL = không giới hạn)
- ☑️ `points_on_retake`: Lần thứ 2 trở đi có cộng điểm không (mặc định: KHÔNG)

> **Mặc định đề xuất:** `allow_retake=true`, `max_attempts=3`, `points_on_retake=false` → khuyến khích ôn lại nhưng không spam điểm.

---

## 🔐 4. Phân quyền

| Role | Quyền |
|---|---|
| **admin** | Tạo/sửa/xóa quiz, xem tất cả submission, xem leaderboard, xem nút "Tạo bài trắc nghiệm" |
| **user** | Làm quiz, xem điểm cá nhân, xem leaderboard public; KHÔNG thấy admin features |

**Cách set admin:**
- Hardcode email `pdanh025@gmail.com` trong env: `ADMIN_EMAILS=pdanh025@gmail.com`
- Khi user login → middleware check email → nếu trong danh sách thì set `role='admin'` trong DB
- API endpoint admin check role server-side (KHÔNG chỉ ẩn UI)

---

## 🗂️ 5. Cấu trúc routes

```
/                           Landing + nút "Đăng nhập Google"
/login                      Trang login (redirect Google OAuth)
/dashboard                  Trang chính sau login - list quiz + tổng điểm + ranking cá nhân
/quiz/[id]                  Trang làm bài (timer, câu hỏi, options)
/quiz/[id]/result/[subId]   Trang kết quả - điểm, đáp án đúng, điểm thưởng đã nhận
/leaderboard                Trang chọn quiz để xem leaderboard
/leaderboard/[quizId]       Top 10/25 của quiz cụ thể
/profile                    Lịch sử điểm + tất cả submission của user

/admin                      (Admin only) Dashboard admin
/admin/quizzes              (Admin only) List tất cả quiz để quản lý
/admin/quizzes/new          (Admin only) Tạo quiz mới
/admin/quizzes/[id]/edit    (Admin only) Sửa quiz
/admin/users                (Admin only) Quản lý user + điểm
```

---

## 🗄️ 6. Database schema (Supabase PostgreSQL)

```sql
-- users (mở rộng từ Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  section TEXT,                          -- VD: "BUỔI 1", "BUỔI 2"
  pass_threshold INT NOT NULL DEFAULT 80, -- % để được +5 điểm
  time_limit_minutes INT,                -- NULL = không giới hạn
  allow_retake BOOLEAN NOT NULL DEFAULT TRUE,
  max_attempts INT,                      -- NULL = không giới hạn
  points_on_retake BOOLEAN NOT NULL DEFAULT FALSE,
  top_n_for_bonus INT NOT NULL DEFAULT 10, -- top 10, có thể đổi 25 sau
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order_index INT NOT NULL,
  options JSONB NOT NULL,  -- [{"key":"A","text":"..."},{"key":"B","text":"..."}, ...]
  correct_answer TEXT NOT NULL,  -- VD: "B"
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL,            -- số câu đúng
  total_questions INT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  time_taken_seconds INT NOT NULL,
  answers JSONB NOT NULL,        -- {"question_id_1": "A", "question_id_2": "C", ...}
  points_earned INT NOT NULL DEFAULT 0,
  attempt_number INT NOT NULL,   -- 1, 2, 3...
  is_first_attempt BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- points_history
CREATE TABLE public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('completion', 'high_score', 'top_rank', 'top_rank_lost', 'admin_adjust')),
  points INT NOT NULL,            -- có thể âm (khi mất top)
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_submissions_quiz_ranking ON public.submissions(quiz_id, percentage DESC, time_taken_seconds ASC);
CREATE INDEX idx_submissions_user ON public.submissions(user_id, submitted_at DESC);
CREATE INDEX idx_points_history_user ON public.points_history(user_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Policies: user xem được của mình, admin xem tất cả; quiz published thì user xem được, etc.
-- (sẽ viết chi tiết trong file migration)
```

---

## 🎨 7. UI/Design

- **Theme:** Dark — nền `#0a0a0a` / `#111111`, card `#1a1a1a`
- **Accent:** Teal `#14b8a6` hoặc Cyan `#06b6d4` (giống "FULL STACK MARKETING")
- **Font:** Inter hoặc Geist Sans
- **Component library:** shadcn/ui (Button, Card, Dialog, Input, RadioGroup, …)

### Mockup các trang quan trọng:

**Dashboard:**
- Header: Logo "TAS GLOBAL QUIZ" | Avatar user (dropdown logout)
- Card "Điểm của bạn: 145" + ranking
- Grid quiz cards: tên, mô tả, badge "Hoàn thành ✓" / "Mới"
- Nút "+ Tạo trắc nghiệm" (chỉ admin)

**Quiz page:**
- Header: tên quiz + timer (nếu có time limit) + progress bar
- Câu hỏi 1 → N (scroll hoặc next/prev)
- Radio button cho options
- Nút "Trước" / "Nộp bài" giống screenshot 1

**Result page:**
- Big card: "Bạn được X/N câu đúng (Y%)"
- Điểm cộng: +10 hoàn thành, +5 đạt 80%, +10 top 10 (nếu có)
- List từng câu: câu hỏi + lựa chọn của bạn + đáp án đúng + giải thích (nếu có)
- Nút "Xem leaderboard" / "Làm lại" (nếu được phép) / "Về dashboard"

**Leaderboard:**
- Table: Rank | Avatar+Name | Score | Time | Date
- Highlight dòng của user hiện tại

---

## 📦 8. Cấu trúc thư mục

```
TAS-QUIZ/
├── README.md
├── PLAN.md                     ← file này
├── .env.example
├── .gitignore
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json             (shadcn config)
├── middleware.ts               (auth + role check)
│
├── app/
│   ├── layout.tsx              (root layout, theme provider)
│   ├── page.tsx                (landing)
│   ├── globals.css
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts   (Supabase OAuth callback)
│   │
│   ├── (main)/
│   │   ├── layout.tsx          (header + nav)
│   │   ├── dashboard/page.tsx
│   │   ├── quiz/[id]/
│   │   │   ├── page.tsx
│   │   │   └── result/[subId]/page.tsx
│   │   ├── leaderboard/
│   │   │   ├── page.tsx
│   │   │   └── [quizId]/page.tsx
│   │   └── profile/page.tsx
│   │
│   ├── admin/
│   │   ├── layout.tsx          (check role)
│   │   ├── page.tsx
│   │   ├── quizzes/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   └── users/page.tsx
│   │
│   └── api/
│       ├── quiz/[id]/submit/route.ts
│       ├── admin/quiz/route.ts
│       └── admin/quiz/[id]/route.ts
│
├── components/
│   ├── ui/                     (shadcn components)
│   ├── auth/
│   │   └── google-login-button.tsx
│   ├── quiz/
│   │   ├── quiz-card.tsx
│   │   ├── question-renderer.tsx
│   │   ├── quiz-timer.tsx
│   │   └── result-summary.tsx
│   ├── leaderboard/
│   │   └── leaderboard-table.tsx
│   └── admin/
│       ├── quiz-form.tsx
│       └── question-editor.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           (browser)
│   │   ├── server.ts           (server components)
│   │   └── middleware.ts
│   ├── points.ts               (logic cộng điểm)
│   ├── ranking.ts              (logic xếp hạng + cập nhật top)
│   ├── auth.ts                 (helpers)
│   └── utils.ts
│
├── types/
│   ├── database.ts             (generated từ Supabase)
│   └── index.ts
│
└── supabase/
    ├── migrations/
    │   ├── 0001_initial_schema.sql
    │   └── 0002_rls_policies.sql
    └── seed.sql                (data mẫu)
```

---

## 🛣️ 9. Roadmap thực hiện

| # | Việc | Ước lượng |
|---|---|---|
| 1 | Init Next.js + TypeScript + Tailwind + shadcn/ui | 10p |
| 2 | Cấu trúc thư mục + base layout + theme provider | 10p |
| 3 | Setup Supabase client (browser/server/middleware) | 15p |
| 4 | SQL migrations + RLS policies | 20p |
| 5 | Trang Login + Google OAuth flow + callback | 20p |
| 6 | Middleware bảo vệ route + auto-set admin role | 15p |
| 7 | Header + nav + user dropdown | 15p |
| 8 | Dashboard - list quiz + điểm cá nhân | 20p |
| 9 | Trang làm quiz: render questions, timer, state | 30p |
| 10 | API nộp bài + tính điểm + ghi DB | 25p |
| 11 | Logic điểm thưởng (points.ts) | 20p |
| 12 | Logic ranking + cập nhật top realtime (ranking.ts) | 25p |
| 13 | Trang kết quả: điểm, đáp án, breakdown | 20p |
| 14 | Trang leaderboard + realtime subscribe | 20p |
| 15 | Trang profile + lịch sử điểm | 15p |
| 16 | Admin panel: list quiz | 15p |
| 17 | Admin: form tạo quiz + add questions | 30p |
| 18 | Admin: sửa quiz | 15p |
| 19 | Admin: quản lý user + điểm | 15p |
| 20 | Seed data mẫu (1-2 quiz để test) | 10p |
| 21 | Viết README chi tiết: setup Supabase, Google OAuth, deploy Vercel | 20p |
| 22 | Polish UI + responsive + bug fix | 30p |
| 23 | Commit + push | 5p |

**Tổng ước lượng:** ~6-7 giờ làm việc của Claude.

---

## ⚠️ 10. Việc user phải làm thủ công sau khi Claude code xong

Claude không thể tạo tài khoản Supabase / Google Cloud hộ user. User cần:

### Bước 1: Tạo Supabase project
1. Vào https://supabase.com → Sign in → New Project
2. Đặt tên: `tas-global-quiz`
3. Chọn region gần (Singapore)
4. Lấy `Project URL` và `anon key` từ Settings > API

### Bước 2: Chạy SQL migrations
- Vào SQL Editor trong Supabase
- Copy nội dung file `supabase/migrations/0001_initial_schema.sql` → Run
- Copy nội dung file `supabase/migrations/0002_rls_policies.sql` → Run

### Bước 3: Setup Google OAuth
1. Vào https://console.cloud.google.com → New Project
2. Vào APIs & Services > Credentials > Create OAuth 2.0 Client ID
3. Authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Copy Client ID + Secret
5. Trong Supabase: Authentication > Providers > Google → enable + paste credentials

### Bước 4: Setup env
Copy `.env.example` thành `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=pdanh025@gmail.com
```

### Bước 5: Chạy local
```bash
npm install
npm run dev
```

### Bước 6: Deploy Vercel
1. Push code lên GitHub
2. Vào https://vercel.com → Import project
3. Add env vars y như local
4. Deploy

---

## 📌 11. Trạng thái hiện tại

- ✅ Đã chốt toàn bộ yêu cầu với user (xem mục 2)
- ✅ **ĐÃ CODE XONG** toàn bộ web app theo plan (Next.js 14 + Supabase)
- ✅ `npm run build` + `npm run lint` pass sạch
- 🔜 **Việc của user**: tạo Supabase project, chạy migrations, setup Google
  OAuth, điền `.env.local`, deploy Vercel (xem README mục Setup)

### Đã hoàn thành
- [x] Config: Next.js, TS, Tailwind, theme dark teal, middleware auth/role
- [x] Supabase clients (browser/server/service/middleware) + migrations + RLS +
      RPC (`get_leaderboard`, `adjust_user_points`, `is_admin`) + seed mẫu
- [x] Google OAuth login + callback (tự set admin theo `ADMIN_EMAILS`)
- [x] Dashboard, trang làm bài (timer + state), API nộp bài + chấm điểm
- [x] Logic điểm (`points.ts`) + ranking realtime + edge case mất top
      (`ranking.ts`)
- [x] Trang kết quả (đáp án + giải thích + breakdown điểm)
- [x] Leaderboard realtime, profile + lịch sử điểm
- [x] Admin: list / tạo / sửa / xóa quiz, quản lý user + chỉnh điểm thủ công

---

## 🤖 12. Hướng dẫn cho Claude tiếp theo (nếu user chuyển session)

Nếu bạn là Claude từ session mới đọc file này:

1. **Đừng bắt đầu code ngay** — user đã yêu cầu "luôn confirm tới khi nào tôi cho phép thực hiện r mới làm"
2. Đọc kỹ file `PLAN.md` này để nắm full context
3. Hỏi user xem: kế hoạch còn đúng không, có cần chỉnh gì không
4. Chỉ bắt đầu code khi user xác nhận **"OK làm đi"** (hoặc tương tự)
5. Branch phát triển: `claude/zen-archimedes-2fdtO`
6. User communicate bằng tiếng Việt
7. User là admin email: `pdanh025@gmail.com`
