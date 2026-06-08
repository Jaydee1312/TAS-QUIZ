import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight } from "lucide-react";
import type { Quiz } from "@/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardListPage() {
  const supabase = createClient();
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const list = (quizzes ?? []) as Quiz[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Bảng xếp hạng</h1>
          <p className="text-sm text-muted-foreground">
            Chọn một bài để xem top người chơi.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có bài trắc nghiệm nào được công bố.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((quiz) => (
            <Link key={quiz.id} href={`/leaderboard/${quiz.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {quiz.section && (
                      <Badge variant="secondary">{quiz.section}</Badge>
                    )}
                    <Badge variant="outline">Top {quiz.top_n_for_bonus}</Badge>
                  </div>
                  <CardTitle className="mt-2 line-clamp-2">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <CardDescription className="line-clamp-2">
                      {quiz.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <span className="flex items-center gap-1 text-sm text-primary">
                    Xem xếp hạng <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
