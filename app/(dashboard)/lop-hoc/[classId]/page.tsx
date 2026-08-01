"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useClassDetail } from "@/hooks/use-class-detail";
import { useMyClasses } from "@/hooks/use-dashboard";
import { useExams } from "@/hooks/use-exams";
import { ExamCard } from "@/components/exam/exam-card";
import { EnrolledStudentsSection } from "@/components/enrollment/enrolled-students-section";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  const isStudent = user?.role === "STUDENT";

  // TEACHER/SUPER_ADMIN: gọi /classes/:id trực tiếp (Student không có quyền, sẽ bị 403)
  const {
    data: classDetailFull,
    isLoading: loadingClassFull,
    isError: errorClassFull,
  } = useClassDetail(classId, !isStudent);

  // STUDENT: lấy từ danh sách lớp đang học đã fetch sẵn, tìm theo classId
  const {
    data: myClasses,
    isLoading: loadingMyClasses,
    isError: errorMyClasses,
  } = useMyClasses();

  const loadingClass = isStudent ? loadingMyClasses : loadingClassFull;
  const errorClass = isStudent ? errorMyClasses : errorClassFull;

  const studentClassInfo = isStudent
    ? myClasses?.items.find((e) => e.classId === classId)?.class
    : undefined;

  const { data: exams, isLoading: loadingExams, isError: errorExams } = useExams(classId);

  if (!user) return null;

  if (loadingClass) return <p className="text-sm text-muted-foreground">Đang tải...</p>;

  if (isStudent) {
    if (errorClass || !studentClassInfo)
      return <p className="text-sm text-destructive">Không tải được thông tin lớp học.</p>;
  } else {
    if (errorClass || !classDetailFull)
      return <p className="text-sm text-destructive">Không tải được thông tin lớp học.</p>;
  }

  // Header hiển thị: 2 nguồn dữ liệu khác nhau tùy role, gộp lại field chung để render 1 giao diện
  const headerName = isStudent ? studentClassInfo!.name : classDetailFull!.name;
  const headerCourseTitle = isStudent ? studentClassInfo!.course.title : classDetailFull!.course.title;
  const headerIsActive = isStudent ? studentClassInfo!.isActive : classDetailFull!.isActive;
  const primaryTeacher = !isStudent
    ? classDetailFull!.teachers.find((t) => t.isPrimary)?.teacher
    : undefined; // Student không có quyền lấy data này, ẩn đi
  const enrollmentCount = !isStudent ? classDetailFull!._count.enrollments : undefined; // tương tự

  const isTeacherOrAdmin = user.role === "TEACHER" || user.role === "SUPER_ADMIN";

  const filteredExams =
    exams && statusFilter !== "ALL" ? exams.filter((e) => e.status === statusFilter) : exams;

  const examListContent = (
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
  );

  return (
    <div className="space-y-6">
      {/* Header thông tin lớp */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{headerName}</h1>
            {!headerIsActive && <Badge variant="secondary">Ngừng hoạt động</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{headerCourseTitle}</p>
          {(primaryTeacher || enrollmentCount !== undefined) && (
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              {primaryTeacher && <span>GV phụ trách: {primaryTeacher.fullName}</span>}
              {enrollmentCount !== undefined && <span>{enrollmentCount} học sinh</span>}
            </div>
          )}
        </div>

        {isTeacherOrAdmin && (
          <Link
            href={`/lop-hoc/${classId}/yeu-cau-lam-lai`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Yêu cầu làm lại
          </Link>
        )}
      </div>

      {isTeacherOrAdmin ? (
        <Tabs defaultValue="exams">
          <TabsList>
            <TabsTrigger value="exams">Bài Thi</TabsTrigger>
            <TabsTrigger value="students">Học Sinh</TabsTrigger>
          </TabsList>
          <TabsContent value="exams" className="pt-4">
            {examListContent}
          </TabsContent>
          <TabsContent value="students" className="pt-4">
            <EnrolledStudentsSection classId={classId} />
          </TabsContent>
        </Tabs>
      ) : (
        examListContent
      )}
    </div>
  );
}
