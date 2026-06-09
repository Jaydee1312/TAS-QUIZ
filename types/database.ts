/**
 * Kiểu dữ liệu cho Supabase. Có thể regenerate bằng:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 * Hiện tại viết tay khớp với supabase/migrations/0001_initial_schema.sql
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---- users ----
interface UsersRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  total_points: number;
  created_at: string;
  updated_at: string;
}
interface UsersInsert {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  role?: "user" | "admin";
  total_points?: number;
  created_at?: string;
  updated_at?: string;
}

// ---- quizzes ----
interface QuizzesRow {
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
interface QuizzesInsert {
  id?: string;
  title: string;
  description?: string | null;
  section?: string | null;
  pass_threshold?: number;
  time_limit_minutes?: number | null;
  allow_retake?: boolean;
  max_attempts?: number | null;
  points_on_retake?: boolean;
  top_n_for_bonus?: number;
  is_published?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---- questions ----
interface QuestionsRow {
  id: string;
  quiz_id: string;
  content: string;
  order_index: number;
  options: Json;
  correct_answer: string;
  question_type: string;
  explanation: string | null;
  created_at: string;
}
interface QuestionsInsert {
  id?: string;
  quiz_id: string;
  content: string;
  order_index: number;
  options: Json;
  correct_answer: string;
  question_type?: string;
  explanation?: string | null;
  created_at?: string;
}

// ---- submissions ----
interface SubmissionsRow {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  answers: Json;
  points_earned: number;
  attempt_number: number;
  is_first_attempt: boolean;
  submitted_at: string;
}
interface SubmissionsInsert {
  id?: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  answers: Json;
  points_earned?: number;
  attempt_number: number;
  is_first_attempt: boolean;
  submitted_at?: string;
}

// ---- points_history ----
interface PointsHistoryRow {
  id: string;
  user_id: string;
  submission_id: string | null;
  type: string;
  points: number;
  reason: string | null;
  metadata: Json | null;
  created_at: string;
}
interface PointsHistoryInsert {
  id?: string;
  user_id: string;
  submission_id?: string | null;
  type: string;
  points: number;
  reason?: string | null;
  metadata?: Json | null;
  created_at?: string;
}

// ---- admin_allowlist ----
interface AdminAllowlistRow {
  email: string;
  added_by: string | null;
  note: string | null;
  created_at: string;
}
interface AdminAllowlistInsert {
  email: string;
  added_by?: string | null;
  note?: string | null;
  created_at?: string;
}

// ---- app_settings ----
interface AppSettingsRow {
  id: number;
  points_completion: number;
  points_high_score: number;
  points_top_rank: number;
  points_rank_top1: number;
  points_rank_top3: number;
  points_rank_top5: number;
  updated_at: string;
}
interface AppSettingsInsert {
  id?: number;
  points_completion?: number;
  points_high_score?: number;
  points_top_rank?: number;
  points_rank_top1?: number;
  points_rank_top3?: number;
  points_rank_top5?: number;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: UsersInsert;
        Update: Partial<UsersInsert>;
        Relationships: [];
      };
      quizzes: {
        Row: QuizzesRow;
        Insert: QuizzesInsert;
        Update: Partial<QuizzesInsert>;
        Relationships: [];
      };
      questions: {
        Row: QuestionsRow;
        Insert: QuestionsInsert;
        Update: Partial<QuestionsInsert>;
        Relationships: [];
      };
      submissions: {
        Row: SubmissionsRow;
        Insert: SubmissionsInsert;
        Update: Partial<SubmissionsInsert>;
        Relationships: [];
      };
      points_history: {
        Row: PointsHistoryRow;
        Insert: PointsHistoryInsert;
        Update: Partial<PointsHistoryInsert>;
        Relationships: [];
      };
      admin_allowlist: {
        Row: AdminAllowlistRow;
        Insert: AdminAllowlistInsert;
        Update: Partial<AdminAllowlistInsert>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettingsRow;
        Insert: AppSettingsInsert;
        Update: Partial<AppSettingsInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_user_points: {
        Args: { p_user_id: string; p_delta: number };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_leaderboard: {
        Args: { p_quiz_id: string; p_limit: number };
        Returns: {
          rank: number;
          user_id: string;
          name: string | null;
          avatar_url: string | null;
          score: number;
          total_questions: number;
          percentage: number;
          time_taken_seconds: number;
          submitted_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
