"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useClassDetail } from "@/hooks/use-class-detail";
import { useExams } from "@/hooks/use-exams";
import { ExamCard } from "@/components/exam/exam-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamStatus } from "@/types/exam";

const STATUS_TABS: { label: string; value: ExamStatus | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đã xuất bản", value: "PUBLISHED" },
  { label: "Đã đóng", value: "CLOSED" },
];

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "ALL">("ALL");

  const { data: classDetail, isLoading: loadingClass, isError: errorClass } = useClassDetail(classId);
  const { data: exams, isLoading: loadingExams, isError: errorExams } = useExams(classId);

  if (!user) return null;

  if (loadingClass) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (errorClass || !classDetail)
    return <p className="text-sm text-destructive">Không tải được thông tin lớp học.</p>;

  const primaryTeacher = classDetail.teachers.find((t) => t.isPrimary)?.teacher;
  const isTeacherOrAdmin = user.role === "TEACHER" || user.role === "SUPER_ADMIN";

  const filteredExams =
    exams && statusFilter !== "ALL" ? exams.filter((e) => e.status === statusFilter) : exams;

  return (
    <div className="space-y-6">
      {/* Header thông tin lớp */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{classDetail.name}</h1>
            {!classDetail.isActive && <Badge variant="secondary">Ngừng hoạt động</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{classDetail.course.title}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            {primaryTeacher && <span>GV phụ trách: {primaryTeacher.fullName}</span>}
            <span>{classDetail._count.enrollments} học sinh</span>
          </div>
        </div>
      </div>

      {/* Danh sách đề thi */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Bài Thi</h2>
          {isTeacherOrAdmin && (
            <Link
              href={`/lop-hoc/${classId}/tao-de-thi`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              + Tạo đề thi
            </Link>
          )}
        </div>

        {isTeacherOrAdmin && (
          <div className="flex gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                size="sm"
                variant={statusFilter === tab.value ? "default" : "outline"}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        )}

        {loadingExams && <p className="text-sm text-muted-foreground">Đang tải đề thi...</p>}
        {errorExams && <p className="text-sm text-destructive">Không tải được danh sách đề thi.</p>}

        {filteredExams && filteredExams.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có đề thi nào.</p>
        )}

        {filteredExams && filteredExams.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} classId={classId} role={user.role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
