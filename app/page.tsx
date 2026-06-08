import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { CheckCircle2, Trophy, Zap } from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="bg-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-primary/5" />

      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Zap className="h-4 w-4" />
          TAS GLOBAL
        </div>

        <h1 className="text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          TAS GLOBAL QUIZ
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Làm bài kiểm tra trắc nghiệm, nhận điểm ngay lập tức, tích lũy điểm
          thưởng và tranh hạng trên bảng xếp hạng của từng bài.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Bắt đầu ngay</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">Đăng nhập với Google</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
            title="Chấm điểm tức thì"
            desc="Nộp bài là thấy ngay điểm số và đáp án đúng từng câu."
          />
          <Feature
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Điểm thưởng tích lũy"
            desc="+10 hoàn thành, +5 đạt ≥80%, +10 lọt top bài."
          />
          <Feature
            icon={<Trophy className="h-6 w-6 text-primary" />}
            title="Bảng xếp hạng realtime"
            desc="Top của mỗi bài cập nhật ngay khi có người nộp."
          />
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 text-left">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
