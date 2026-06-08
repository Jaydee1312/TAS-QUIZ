import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { getCurrentUser } from "@/lib/auth";
import { Zap } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect(searchParams.redirectTo ?? "/dashboard");

  return (
    <main className="bg-grid flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-2 inline-flex items-center gap-2 text-primary"
          >
            <Zap className="h-5 w-5" />
            <span className="font-semibold">TAS GLOBAL</span>
          </Link>
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Dùng tài khoản Google để vào TAS GLOBAL QUIZ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleLoginButton redirectTo={searchParams.redirectTo} />
          <p className="text-center text-xs text-muted-foreground">
            Bằng việc đăng nhập, bạn đồng ý tham gia hệ thống tính điểm thưởng
            của TAS GLOBAL QUIZ.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
