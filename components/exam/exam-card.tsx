import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExamStatusBadge } from "./exam-status-badge";
import type { Exam } from "@/types/exam";
import type { Role } from "@/types/auth";
import { Clock, ListChecks } from "lucide-react";

interface ExamCardProps {
  exam: Exam;
  classId: string;
  role: Role;
}

export function ExamCard({ exam, classId, role }: ExamCardProps) {
  const isStudent = role === "STUDENT";
  const manageHref = `/lop-hoc/${classId}/bai-thi/${exam.id}`;
  const takeHref = `/lop-hoc/${classId}/bai-thi/${exam.id}/lam-bai`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{exam.title}</CardTitle>
          {!isStudent && <ExamStatusBadge status={exam.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {exam.description && (
          <p className="text-sm text-muted-foreground">{exam.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {exam.durationMinutes} phút
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" /> {exam._count.questions} câu hỏi
          </span>
        </div>

        {isStudent ? (
          <Link href={takeHref} className={cn(buttonVariants({ size: "sm" }), "w-full")}>
            Vào làm bài
          </Link>
        ) : (
          <Link
            href={manageHref}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}
          >
            Quản lý đề thi
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
