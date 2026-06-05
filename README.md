# TAS GLOBAL QUIZ

Website làm bài kiểm tra trắc nghiệm với hệ thống tích lũy điểm thưởng.

> ⚠️ **Trạng thái:** Đang ở giai đoạn lập kế hoạch — CHƯA bắt đầu code. Xem chi tiết tại [PLAN.md](./PLAN.md).

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** Next.js API Routes
- **Database & Auth:** Supabase (PostgreSQL + Google OAuth)
- **Deploy:** Vercel free tier

## Tính năng chính
1. Đăng nhập Google OAuth
2. Làm bài trắc nghiệm → nộp bài → hiện điểm và đáp án đúng
3. Hệ thống điểm thưởng tích lũy:
   - +10 điểm khi hoàn thành bài
   - +5 điểm nếu đúng ≥ 80%
   - +10 điểm nếu lọt top 10 (nhanh + chính xác nhất) của quiz đó
4. Leaderboard realtime mỗi quiz
5. Admin panel quản lý quiz (tạo/sửa/xóa)

## Phân quyền
- **Admin** (`pdanh025@gmail.com`): Tạo/sửa/xóa quiz, xem tất cả submission, cấu hình hệ thống
- **User**: Làm bài, xem điểm cá nhân, xem leaderboard

## Branch phát triển
`claude/zen-archimedes-2fdtO`

## Hướng dẫn cho Claude (khi tiếp tục từ session khác)
Đọc [PLAN.md](./PLAN.md) để có toàn bộ context, requirements và roadmap. User đã confirm kế hoạch, đang chờ lệnh "OK làm đi" để bắt đầu code.
