import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Plus, Shield, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createClient();
  const me = await getCurrentUser();
  const superAdmin = isSuperAdmin(me?.email);

  const [{ count: quizCount }, { count: userCount }, { count: subCount }] =
    await Promise.all([
      supabase.from("quizzes").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Bảng điều khiển Admin</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý bài trắc nghiệm và người dùng.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<BookOpen />} label="Bài trắc nghiệm" value={quizCount ?? 0} />
        <StatCard icon={<Users />} label="Người dùng" value={userCount ?? 0} />
        <StatCard icon={<FileText />} label="Lượt nộp bài" value={subCount ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý bài</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin/quizzes/new" className="gap-2">
                <Plus className="h-4 w-4" /> Tạo bài mới
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/quizzes">Danh sách bài</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Người dùng</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/users">Quản lý người dùng</Link>
            </Button>
            {superAdmin && (
              <Button asChild variant="outline">
                <Link href="/admin/admins" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Quản lý admin
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {superAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Bạn là super admin
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[15px] text-muted-foreground">
            Bạn có thể cấp quyền admin cho người khác (để họ tạo / sửa bài trắc
            nghiệm) tại{" "}
            <Link href="/admin/admins" className="text-primary hover:underline">
              Quản lý admin
            </Link>
            .
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
