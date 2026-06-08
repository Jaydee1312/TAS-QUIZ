import { QuizImport } from "@/components/admin/quiz-import";
import { FileSpreadsheet } from "lucide-react";

export default function ImportQuizPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight-apple">
            Tạo bài hàng loạt từ Excel
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Tải file mẫu, điền nội dung, rồi tải lên để tạo nhiều bài cùng lúc.
          </p>
        </div>
      </div>

      <QuizImport />
    </div>
  );
}
