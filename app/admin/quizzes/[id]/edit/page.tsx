import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuizForm } from "@/components/admin/quiz-form";
import type { Question, Quiz, QuizOption } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditQuizPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!quizRow) notFound();
  const quiz = quizRow as Quiz;

  const { data: questionRows } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("order_index", { ascending: true });

  const questions: Question[] = (questionRows ?? []).map((q) => ({
    ...q,
    options: q.options as unknown as QuizOption[],
  })) as Question[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sửa bài trắc nghiệm</h1>
        <p className="text-sm text-muted-foreground">{quiz.title}</p>
      </div>
      <QuizForm quiz={quiz} questions={questions} />
    </div>
  );
}
