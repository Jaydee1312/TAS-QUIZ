export type Role = "user" | "admin";

export type PointsType =
  | "completion"
  | "high_score"
  | "top_rank"
  | "top_rank_lost"
  | "admin_adjust";

export interface QuizOption {
  key: string; // "A", "B", "C", "D"
  text: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type QuestionType = "single" | "multiple";

export interface Question {
  id: string;
  quiz_id: string;
  content: string;
  order_index: number;
  options: QuizOption[];
  correct_answer: string; // single: "B"; multiple: "A,C"
  question_type: QuestionType;
  explanation: string | null;
  created_at: string;
}

/** Câu hỏi gửi xuống client khi đang làm bài — KHÔNG kèm đáp án đúng */
export type PublicQuestion = Omit<Question, "correct_answer" | "explanation">;

export interface Submission {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  answers: Record<string, string>;
  points_earned: number;
  attempt_number: number;
  is_first_attempt: boolean;
  submitted_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  submission_id: string | null;
  type: PointsType;
  points: number;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  submitted_at: string;
}

/** Chi tiết từng câu trong trang kết quả */
export interface QuestionResult {
  question: Question;
  user_answer: string | null;
  is_correct: boolean;
}
