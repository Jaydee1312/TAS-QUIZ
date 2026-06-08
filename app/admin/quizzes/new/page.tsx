import { QuizForm } from "@/components/admin/quiz-form";

export default function NewQuizPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tạo bài trắc nghiệm</h1>
        <p className="text-sm text-muted-foreground">
          Điền thông tin, cấu hình và thêm câu hỏi cho bài mới.
        </p>
      </div>
      <QuizForm />
    </div>
  );
}
