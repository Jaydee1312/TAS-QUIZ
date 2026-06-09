"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { parseQuizWorkbook, TEMPLATE, type ImportQuiz } from "@/lib/quiz-import";

export function QuizImport() {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [quizzes, setQuizzes] = React.useState<ImportQuiz[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  /** Tải file Excel mẫu (2 sheet: Quiz + CauHoi) đã điền ví dụ. */
  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const quizAoa = [
      TEMPLATE.quizHeaders,
      ["B1", "Buổi 1 — Tổng quan", "Kiến thức nền tảng", "BUỔI 1", 10, 80, 10, "Có", 3, "Không", "Có"],
      ["B2", "Buổi 2 — Nâng cao", "", "BUỔI 2", "", 80, 10, "Có", "", "Không", "Không"],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(quizAoa);
    ws1["!cols"] = TEMPLATE.quizHeaders.map(() => ({ wch: 16 }));
    XLSX.utils.book_append_sheet(wb, ws1, TEMPLATE.quizSheet);

    const qAoa = [
      TEMPLATE.questionHeaders,
      ["B1", 1, "2 + 2 = ?", "3", "4", "5", "6", "B", "Cộng cơ bản"],
      ["B1", 2, "Thủ đô Việt Nam?", "Hà Nội", "Huế", "Đà Nẵng", "TP.HCM", "A", ""],
      // Câu chọn nhiều đáp án: cột dap_an_dung điền nhiều chữ cái, vd "A,C"
      ["B1", 3, "Số nào là số chẵn?", "2", "3", "4", "5", "A,C", "2 và 4 là số chẵn"],
      ["B2", 1, "HTML là viết tắt của?", "Hyper Text Markup Language", "High Tech...", "Hot Mail", "Home Tool", "A", "Ngôn ngữ đánh dấu siêu văn bản"],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(qAoa);
    ws2["!cols"] = TEMPLATE.questionHeaders.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws2, TEMPLATE.questionSheet);

    XLSX.writeFile(wb, "mau-tao-bai-tas-quiz.xlsx");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      const find = (kw: string[]) =>
        wb.SheetNames.find((n) =>
          kw.some((k) => n.toLowerCase().replace(/\s/g, "").includes(k))
        );
      const quizName = find(["quiz", "bai", "bài"]) ?? wb.SheetNames[0];
      const qName =
        find(["cauhoi", "câuhỏi", "question", "cau", "câu"]) ?? wb.SheetNames[1];

      if (!quizName || !qName) {
        throw new Error("File cần 2 sheet: Quiz và CauHoi");
      }

      const quizRows = XLSX.utils.sheet_to_json(wb.Sheets[quizName], { defval: "" });
      const questionRows = XLSX.utils.sheet_to_json(wb.Sheets[qName], { defval: "" });

      const result = parseQuizWorkbook(
        quizRows as Record<string, unknown>[],
        questionRows as Record<string, unknown>[]
      );
      setQuizzes(result.quizzes);
      setErrors(result.errors);

      if (result.quizzes.length > 0) {
        toast.success(`Đọc được ${result.quizzes.length} bài từ file`);
      }
    } catch (err) {
      setQuizzes([]);
      setErrors([err instanceof Error ? err.message : "Không đọc được file"]);
      toast.error("Không đọc được file Excel");
    }
  }

  async function createAll() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/quiz/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizzes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tạo thất bại");

      const okN = data.created?.length ?? 0;
      const failN = data.failed?.length ?? 0;
      if (okN) toast.success(`Đã tạo ${okN} bài`);
      if (failN) toast.error(`${failN} bài lỗi`);
      router.push("/admin/quizzes");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setCreating(false);
    }
  }

  const totalQuestions = quizzes.reduce((s, q) => s + q.questions.length, 0);
  const canCreate = quizzes.length > 0 && errors.length === 0;

  return (
    <div className="space-y-6">
      {/* Bước 1: tải mẫu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[19px]">1. Tải file mẫu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[15px] text-muted-foreground">
            File mẫu có 2 sheet: <strong>Quiz</strong> (mỗi dòng 1 bài + cấu hình)
            và <strong>CauHoi</strong> (mỗi dòng 1 câu). Cột{" "}
            <code className="rounded bg-secondary px-1">ma_bai</code> để liên kết
            câu hỏi với bài. Câu nhiều đáp án: cột{" "}
            <code className="rounded bg-secondary px-1">dap_an_dung</code> điền
            nhiều chữ cái, ví dụ{" "}
            <code className="rounded bg-secondary px-1">A,C</code>.
          </p>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> Tải file mẫu (.xlsx)
          </Button>
        </CardContent>
      </Card>

      {/* Bước 2: upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[19px]">2. Tải lên file đã điền</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Chọn file Excel
          </Button>
          {fileName && (
            <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" /> {fileName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lỗi */}
      {errors.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[17px] text-destructive">
              <AlertCircle className="h-5 w-5" /> Cần sửa {errors.length} lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-[14px] text-muted-foreground">
              {errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errors.length > 20 && <li>… và {errors.length - 20} lỗi khác</li>}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Xem trước */}
      {quizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[19px]">
              <span>3. Xem trước ({quizzes.length} bài · {totalQuestions} câu)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quizzes.map((qz) => (
              <div
                key={qz.key}
                className="flex items-center justify-between rounded-xl border border-hairline px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{qz.quiz.title}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {qz.quiz.section ? `${qz.quiz.section} · ` : ""}
                    {qz.questions.length} câu · ngưỡng {qz.quiz.pass_threshold}% ·
                    Top {qz.quiz.top_n_for_bonus}
                  </p>
                </div>
                {qz.quiz.is_published ? (
                  <Badge variant="success">Công bố</Badge>
                ) : (
                  <Badge variant="outline">Nháp</Badge>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button
                onClick={createAll}
                disabled={!canCreate || creating}
                className="gap-2"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Tạo tất cả {quizzes.length} bài
              </Button>
            </div>
            {!canCreate && errors.length > 0 && (
              <p className="text-right text-[13px] text-destructive">
                Sửa hết lỗi trong file rồi tải lại để tạo.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
