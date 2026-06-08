import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
      <p className="max-w-sm text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Button asChild>
        <Link href="/dashboard">Về trang chính</Link>
      </Button>
    </main>
  );
}
