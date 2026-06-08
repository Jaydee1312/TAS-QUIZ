-- =====================================================================
-- TAS GLOBAL QUIZ — Seed data mẫu (tùy chọn)
-- Chạy trong SQL Editor SAU khi đã chạy 0001 + 0002.
-- created_by để NULL vì chạy seed trước khi có user đăng nhập.
-- =====================================================================

DO $$
DECLARE
  quiz1 UUID;
  quiz2 UUID;
BEGIN
  -- ----- Quiz 1 -----
  INSERT INTO public.quizzes
    (title, description, section, pass_threshold, time_limit_minutes,
     allow_retake, max_attempts, points_on_retake, top_n_for_bonus, is_published)
  VALUES
    ('Buổi 1 — Tổng quan Marketing',
     'Kiểm tra kiến thức nền tảng về marketing hiện đại.',
     'BUỔI 1', 80, 10, TRUE, 3, FALSE, 10, TRUE)
  RETURNING id INTO quiz1;

  INSERT INTO public.questions (quiz_id, content, order_index, options, correct_answer, explanation) VALUES
  (quiz1, '4P trong marketing mix bao gồm những yếu tố nào?', 0,
    '[{"key":"A","text":"Product, Price, Place, Promotion"},{"key":"B","text":"People, Process, Product, Price"},{"key":"C","text":"Plan, Product, Price, Place"},{"key":"D","text":"Promotion, People, Place, Plan"}]'::jsonb,
    'A', '4P cổ điển gồm Product, Price, Place, Promotion.'),
  (quiz1, 'SEO là viết tắt của cụm từ nào?', 1,
    '[{"key":"A","text":"Search Engine Operation"},{"key":"B","text":"Search Engine Optimization"},{"key":"C","text":"Social Engine Optimization"},{"key":"D","text":"Search Easy Optimization"}]'::jsonb,
    'B', 'SEO = Search Engine Optimization — tối ưu hóa công cụ tìm kiếm.'),
  (quiz1, 'Chỉ số CTR đo lường điều gì?', 2,
    '[{"key":"A","text":"Tỷ lệ chuyển đổi"},{"key":"B","text":"Chi phí mỗi lần click"},{"key":"C","text":"Tỷ lệ nhấp chuột"},{"key":"D","text":"Tổng lượt hiển thị"}]'::jsonb,
    'C', 'CTR (Click-Through Rate) = số click / số lần hiển thị.'),
  (quiz1, 'Kênh nào sau đây thuộc Owned Media?', 3,
    '[{"key":"A","text":"Quảng cáo Facebook"},{"key":"B","text":"Website công ty"},{"key":"C","text":"Bài PR trên báo"},{"key":"D","text":"Review của khách hàng"}]'::jsonb,
    'B', 'Owned Media là kênh do doanh nghiệp sở hữu, ví dụ website, fanpage.'),
  (quiz1, 'Phễu marketing AIDA gồm các bước theo thứ tự?', 4,
    '[{"key":"A","text":"Attention, Interest, Desire, Action"},{"key":"B","text":"Awareness, Interest, Decision, Action"},{"key":"C","text":"Attention, Intent, Desire, Acquisition"},{"key":"D","text":"Action, Interest, Desire, Attention"}]'::jsonb,
    'A', 'AIDA = Attention → Interest → Desire → Action.');

  -- ----- Quiz 2 -----
  INSERT INTO public.quizzes
    (title, description, section, pass_threshold, time_limit_minutes,
     allow_retake, max_attempts, points_on_retake, top_n_for_bonus, is_published)
  VALUES
    ('Buổi 2 — Digital Advertising',
     'Kiến thức về quảng cáo số: Google Ads, Meta Ads, đo lường.',
     'BUỔI 2', 80, NULL, TRUE, NULL, FALSE, 10, TRUE)
  RETURNING id INTO quiz2;

  INSERT INTO public.questions (quiz_id, content, order_index, options, correct_answer, explanation) VALUES
  (quiz2, 'CPC là gì?', 0,
    '[{"key":"A","text":"Cost Per Click"},{"key":"B","text":"Cost Per Conversion"},{"key":"C","text":"Click Per Customer"},{"key":"D","text":"Cost Per Customer"}]'::jsonb,
    'A', 'CPC = Cost Per Click — chi phí cho mỗi lượt nhấp.'),
  (quiz2, 'Nền tảng nào thuộc hệ sinh thái Meta Ads?', 1,
    '[{"key":"A","text":"YouTube"},{"key":"B","text":"Instagram"},{"key":"C","text":"TikTok"},{"key":"D","text":"LinkedIn"}]'::jsonb,
    'B', 'Instagram thuộc Meta (Facebook), nằm trong Meta Ads.'),
  (quiz2, 'ROAS đo lường điều gì?', 2,
    '[{"key":"A","text":"Tỷ lệ thoát trang"},{"key":"B","text":"Doanh thu trên chi phí quảng cáo"},{"key":"C","text":"Số lần hiển thị quảng cáo"},{"key":"D","text":"Tỷ lệ giữ chân khách"}]'::jsonb,
    'B', 'ROAS = Return On Ad Spend = doanh thu / chi phí quảng cáo.'),
  (quiz2, 'Remarketing (tiếp thị lại) nhắm đến nhóm nào?', 3,
    '[{"key":"A","text":"Người chưa từng biết đến thương hiệu"},{"key":"B","text":"Người đã từng tương tác với thương hiệu"},{"key":"C","text":"Đối thủ cạnh tranh"},{"key":"D","text":"Nhân viên nội bộ"}]'::jsonb,
    'B', 'Remarketing nhắm lại nhóm đã từng tương tác/ghé thăm.');
END $$;
