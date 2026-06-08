import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
import type { Quiz } from "@/types";

interface QuizCardProps {
  quiz: Quiz;
  questionCount?: number;
  completed?: boolean;
  bestPercentage?: number | null;
}

export function QuizCard({
  quiz,
  questionCount,
  completed,
  bestPercentage,
}: QuizCardProps) {
  return (
    <Card className="flex flex-col transition-colors hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.section && (
              <Badge variant="secondary">{quiz.section}</Badge>
            )}
            {completed ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Đã hoàn thành
              </Badge>
            ) : (
              <Badge>Mới</Badge>
            )}
          </div>
        </div>
        <CardTitle className="mt-2 line-clamp-2">{quiz.title}</CardTitle>
        {quiz.description && (
          <CardDescription className="line-clamp-2">
            {quiz.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {typeof questionCount === "number" && (
            <span>{questionCount} câu hỏi</span>
          )}
          {quiz.time_limit_minutes ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {quiz.time_limit_minutes} phút
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Không giới hạn
            </span>
          )}
          {completed && typeof bestPercentage === "number" && (
            <span className="font-medium text-primary">
              Điểm cao nhất: {bestPercentage}%
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full gap-2">
          <Link href={`/quiz/${quiz.id}`}>
            {completed ? "Làm lại / Xem" : "Bắt đầu làm bài"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
