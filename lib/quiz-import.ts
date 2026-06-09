import type { QuizOption, QuestionType } from "@/types";

/** Cấu trúc 1 bài sau khi parse từ Excel, sẵn sàng gửi lên API tạo bài. */
export interface ImportQuestion {
  content: string;
  options: QuizOption[];
  correct_answer: string;
  question_type: QuestionType;
  explanation: string | null;
}

export interface ImportQuiz {
  key: string; // ma_bai — chỉ dùng để liên kết, không lưu DB
  quiz: {
    title: string;
    description: string | null;
    section: string | null;
    pass_threshold: number;
    time_limit_minutes: number | null;
    allow_retake: boolean;
    max_attempts: number | null;
    points_on_retake: boolean;
    top_n_for_bonus: number;
    is_published: boolean;
  };
  questions: ImportQuestion[];
}

export interface ParseResult {
  quizzes: ImportQuiz[];
  errors: string[];
}

type Row = Record<string, unknown>;

/** Chuẩn hoá tên cột: bỏ dấu, bỏ ký tự đặc biệt, lowercase. */
function norm(s: string): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // bỏ dấu thanh tiếng Việt
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Lấy giá trị 1 ô theo danh sách alias (đã chuẩn hoá). */
function field(row: Row, aliases: string[]): string {
  const map = new Map<string, unknown>();
  for (const k of Object.keys(row)) map.set(norm(k), row[k]);
  for (const a of aliases) {
    const v = map.get(a);
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

function parseBool(v: string, def: boolean): boolean {
  if (!v) return def;
  const n = norm(v);
  if (["co", "x", "true", "1", "yes", "y", "co1"].includes(n)) return true;
  if (["khong", "false", "0", "no", "n"].includes(n)) return false;
  return def;
}

function parseIntOrNull(v: string): number | null {
  if (!v) return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
}

const COL = {
  key: ["mabai", "quizkey", "ma", "makey"],
  title: ["tieude", "title", "tenbai", "ten"],
  description: ["mota", "description", "desc"],
  section: ["phan", "section", "buoi"],
  time: ["thoigianphut", "thoigian", "timelimitminutes", "time"],
  pass: ["nguongdat", "nguong", "passthreshold", "nguongdatphantram"],
  topn: ["topn", "top", "topnforbonus"],
  retake: ["cholamlai", "allowretake", "lamlai"],
  maxAttempts: ["solantoida", "maxattempts", "solan"],
  pointsRetake: ["congdiemlamlai", "pointsonretake"],
  publish: ["congbo", "ispublished", "publish"],
  // câu hỏi
  order: ["thutu", "order", "stt"],
  content: ["noidung", "content", "cauhoi", "question"],
  optA: ["dapana", "optiona", "a", "luachona"],
  optB: ["dapanb", "optionb", "b", "luachonb"],
  optC: ["dapanc", "optionc", "c", "luachonc"],
  optD: ["dapand", "optiond", "d", "luachond"],
  optE: ["dapane", "optione", "e", "luachone"],
  optF: ["dapanf", "optionf", "f", "luachonf"],
  correct: ["dapandung", "correct", "dapan", "answer"],
  explanation: ["giaithich", "explanation", "giaithichdapan"],
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Chuyển dữ liệu 2 sheet (Quiz + CauHoi) thành danh sách bài sẵn sàng tạo.
 * Trả về cả danh sách lỗi để hiển thị cho admin trước khi import.
 */
export function parseQuizWorkbook(
  quizRows: Row[],
  questionRows: Row[]
): ParseResult {
  const errors: string[] = [];
  const quizzes = new Map<string, ImportQuiz>();

  // 1. Bài.
  quizRows.forEach((row, i) => {
    const title = field(row, COL.title);
    if (!title) return; // bỏ dòng trống
    const key = field(row, COL.key) || title;
    if (quizzes.has(key)) {
      errors.push(`Quiz dòng ${i + 2}: trùng mã bài "${key}"`);
      return;
    }
    const pass = parseIntOrNull(field(row, COL.pass));
    const topn = parseIntOrNull(field(row, COL.topn));
    quizzes.set(key, {
      key,
      quiz: {
        title,
        description: field(row, COL.description) || null,
        section: field(row, COL.section) || null,
        pass_threshold: pass ?? 80,
        time_limit_minutes: parseIntOrNull(field(row, COL.time)),
        allow_retake: parseBool(field(row, COL.retake), true),
        max_attempts: parseIntOrNull(field(row, COL.maxAttempts)),
        points_on_retake: parseBool(field(row, COL.pointsRetake), false),
        top_n_for_bonus: topn ?? 10,
        is_published: parseBool(field(row, COL.publish), false),
      },
      questions: [],
    });
  });

  if (quizzes.size === 0) {
    errors.push("Không tìm thấy bài nào ở sheet Quiz (thiếu cột tiêu đề?).");
  }

  // 2. Câu hỏi.
  questionRows.forEach((row, i) => {
    const content = field(row, COL.content);
    if (!content) return; // bỏ dòng trống
    const key = field(row, COL.key);

    let target: ImportQuiz | undefined;
    if (key) target = quizzes.get(key);
    if (!target && quizzes.size === 1) target = [...quizzes.values()][0];
    if (!target) {
      errors.push(
        `Câu hỏi dòng ${i + 2}: không khớp mã bài "${key}" nào ở sheet Quiz`
      );
      return;
    }

    const aliasGroups = [COL.optA, COL.optB, COL.optC, COL.optD, COL.optE, COL.optF];
    const options: QuizOption[] = [];
    aliasGroups.forEach((aliases, idx) => {
      const text = field(row, aliases);
      if (text) options.push({ key: LETTERS[idx], text });
    });

    // Đáp án đúng: gom tất cả chữ cái A–F (vd "A,C" / "AC" / "A và C" → A,C).
    const correctKeys = [
      ...new Set(field(row, COL.correct).toUpperCase().match(/[A-F]/g) ?? []),
    ].sort();

    if (options.length < 2) {
      errors.push(`Câu hỏi dòng ${i + 2}: cần ít nhất 2 lựa chọn`);
      return;
    }
    if (correctKeys.length === 0) {
      errors.push(`Câu hỏi dòng ${i + 2}: thiếu đáp án đúng`);
      return;
    }
    const bad = correctKeys.filter((k) => !options.some((o) => o.key === k));
    if (bad.length > 0) {
      errors.push(
        `Câu hỏi dòng ${i + 2}: đáp án "${bad.join(",")}" không khớp lựa chọn nào (A–${LETTERS[options.length - 1]})`
      );
      return;
    }

    target.questions.push({
      content,
      options,
      correct_answer: correctKeys.join(","),
      question_type: correctKeys.length > 1 ? "multiple" : "single",
      explanation: field(row, COL.explanation) || null,
    });
  });

  // 3. Bài không có câu hỏi.
  for (const qz of quizzes.values()) {
    if (qz.questions.length === 0) {
      errors.push(`Bài "${qz.quiz.title}" chưa có câu hỏi nào.`);
    }
  }

  return { quizzes: [...quizzes.values()], errors };
}

/** Định nghĩa các sheet/cột cho file mẫu (dùng để sinh template). */
export const TEMPLATE = {
  quizSheet: "Quiz",
  questionSheet: "CauHoi",
  quizHeaders: [
    "ma_bai",
    "tieu_de",
    "mo_ta",
    "phan",
    "thoi_gian_phut",
    "nguong_dat",
    "top_n",
    "cho_lam_lai",
    "so_lan_toi_da",
    "cong_diem_lam_lai",
    "cong_bo",
  ],
  questionHeaders: [
    "ma_bai",
    "thu_tu",
    "noi_dung",
    "dap_an_a",
    "dap_an_b",
    "dap_an_c",
    "dap_an_d",
    "dap_an_dung",
    "giai_thich",
  ],
};
