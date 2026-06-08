import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { CheckCircle2, Trophy, Zap } from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      {/* Hero tile — light canvas */}
      <section className="flex flex-col items-center justify-center px-6 pb-20 pt-28 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-[19px] font-semibold text-primary">
            TAS GLOBAL
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight-apple sm:text-6xl">
            Bài kiểm tra trắc nghiệm,
            <br className="hidden sm:block" /> nâng tầm chuyên nghiệp.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-[21px] font-normal leading-snug text-muted-foreground">
            Làm bài, nhận điểm tức thì, tích lũy điểm thưởng và tranh hạng trên
            bảng xếp hạng realtime của từng bài.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">Bắt đầu ngay</Link>
            </Button>
            <Button asChild size="lg" variant="link" className="text-[17px]">
              <Link href="/login">Đăng nhập với Google ›</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature tile — parchment canvas (color change is the divider) */}
      <section className="bg-surface px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
          <Feature
            icon={<CheckCircle2 />}
            title="Chấm điểm tức thì"
            desc="Nộp bài là thấy ngay điểm số và đáp án đúng từng câu kèm giải thích."
          />
          <Feature
            icon={<Zap />}
            title="Điểm thưởng tích lũy"
            desc="+10 hoàn thành · +5 đạt ngưỡng · +10 lọt top bài kiểm tra."
          />
          <Feature
            icon={<Trophy />}
            title="Xếp hạng realtime"
            desc="Top của mỗi bài cập nhật ngay khi có người nộp bài mới."
          />
        </div>
      </section>
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
    <div className="rounded-card border border-hairline bg-background p-7 text-left">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <h3 className="text-[19px] font-semibold tracking-tight-apple">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
