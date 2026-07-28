"use client";

import { useAuthStore } from "@/store/auth-store";
import { useAdminDashboard, useTeacherDashboard, useMyClasses } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClassCard } from "@/components/dashboard/class-card";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { Users, BookOpen, GraduationCap, ClipboardList, FileCheck } from "lucide-react";

export default function TrangChuPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (user.role === "SUPER_ADMIN") return <AdminHome fullName={user.fullName} />;
  if (user.role === "TEACHER") return <TeacherHome fullName={user.fullName} />;
  return <StudentHome fullName={user.fullName} />;
}

function AdminHome({ fullName }: { fullName: string }) {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Chào mừng trở lại, ${fullName}`}
        subtitle={`${data.classes.active} lớp đang hoạt động · ${Math.round(data.exams.submissionRate * 100)}% bài thi đã chấm`}
        cta={{ label: "Xem báo cáo thống kê", href: "/bao-cao-thong-ke" }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={data.users.total}
          icon={Users}
          tone="solid"
          hint={`${data.users.byRole.teacher} GV · ${data.users.byRole.student} HS`}
        />
        <StatCard label="Khóa học" value={data.courses.total} icon={BookOpen} />
        <StatCard
          label="Lớp học đang hoạt động"
          value={data.classes.active}
          icon={GraduationCap}
          tone="soft"
          hint={`${data.classes.total} tổng số lớp`}
        />
        <StatCard label="Lượt ghi danh" value={data.enrollments.total} icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Bài Thi</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tổng đề thi" value={data.exams.total} />
            <StatCard
              label="Tỷ lệ đã chấm"
              value={`${Math.round(data.exams.submissionRate * 100)}%`}
              icon={FileCheck}
            />
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Bài Tập</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tổng bài tập" value={data.assignments.total} />
            <StatCard label="Nộp trễ" value={data.assignments.lateSubmissions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherHome({ fullName }: { fullName: string }) {
  const { data, isLoading, isError } = useTeacherDashboard();

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  const pendingTotal = data.exams.pendingGrading + data.assignments.pendingGrading;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Chào mừng trở lại, ${fullName}`}
        subtitle={`Bạn phụ trách ${data.classes.total} lớp học · ${pendingTotal} bài chờ chấm`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bài chờ chấm"
          value={pendingTotal}
          icon={FileCheck}
          tone={pendingTotal > 0 ? "solid" : "plain"}
          hint={pendingTotal > 0 ? "Cần xử lý sớm" : "Đã chấm hết"}
        />
        <StatCard label="Lớp phụ trách" value={data.classes.total} icon={GraduationCap} />
        <StatCard label="Học sinh" value={data.students.totalUniqueStudents} icon={Users} />
        <StatCard label="Đề thi đã publish" value={data.exams.published} icon={BookOpen} tone="soft" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Lớp tôi phụ trách</h2>
        {data.classes.list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa phụ trách lớp nào.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.classes.list.map((c) => (
              <ClassCard
                key={c.id}
                classId={c.id}
                name={c.name}
                courseName={c.courseName}
                studentCount={c.studentCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentHome({ fullName }: { fullName: string }) {
  const { data, isLoading, isError } = useMyClasses();

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={`Chào mừng trở lại, ${fullName}`}
        subtitle={`Bạn đang học ${data.items.length} lớp`}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Lớp học của tôi</h2>
        {data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bạn chưa được ghi danh vào lớp nào.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((enrollment) => (
              <ClassCard
                key={enrollment.id}
                classId={enrollment.class.id}
                name={enrollment.class.name}
                courseName={enrollment.class.course.title}
                isActive={enrollment.class.isActive}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="text-sm text-muted-foreground">Đang tải dữ liệu...</div>;
}

function ErrorState() {
  return (
    <div className="text-sm text-destructive">
      Không tải được dữ liệu. Vui lòng thử lại sau.
    </div>
  );
}
