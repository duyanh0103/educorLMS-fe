"use client";

import { useState } from "react";
import { useEnrollments, useUnenrollStudent } from "@/hooks/use-enrollments";
import { EnrollStudentsDialog } from "./enroll-students-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/types/api";

export function EnrolledStudentsSection({ classId }: { classId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useEnrollments(classId, page);
  const unenroll = useUnenrollStudent(classId);
  const [error, setError] = useState<string | null>(null);

  async function handleUnenroll(studentId: string, fullName: string) {
    if (!window.confirm(`Gỡ "${fullName}" khỏi lớp này?`)) return;
    setError(null);
    try {
      await unenroll.mutateAsync(studentId);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Không thể gỡ học sinh.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.meta.total} học sinh đã ghi danh` : "Đang tải..."}
        </p>
        <EnrollStudentsDialog classId={classId} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách học sinh.</p>}
      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có học sinh nào trong lớp.</p>
      )}

      {data && data.items.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Họ và Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.student.username}</TableCell>
                  <TableCell>{e.student.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{e.student.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnenroll(e.studentId, e.student.fullName)}
                      disabled={unenroll.isPending}
                    >
                      Gỡ khỏi lớp
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {data.meta.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
