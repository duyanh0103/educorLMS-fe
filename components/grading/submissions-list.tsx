"use client";

import { useState } from "react";
import Link from "next/link";
import { useExamSubmissions } from "@/hooks/use-submissions-grading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatDateTimeVN } from "@/lib/utils";

export function SubmissionsList({ classId, examId }: { classId: string; examId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useExamSubmissions(examId, page);

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách bài nộp.</p>}
      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có học sinh nào nộp bài.</p>
      )}

      {data && data.items.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học sinh</TableHead>
                <TableHead>Lần nộp</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Nộp lúc</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.student.fullName}</TableCell>
                  <TableCell>{s.attemptNumber}</TableCell>
                  <TableCell>{s.score ?? "—"}</TableCell>
                  <TableCell>
                    {s.status === "GRADED" ? (
                      <Badge className="bg-primary/10 text-primary">Đã chấm</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">Chờ chấm</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTimeVN(s.submittedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Base UI Button không có "asChild" — dùng buttonVariants() trực tiếp trên <Link>. */}
                    <Link
                      href={`/lop-hoc/${classId}/bai-thi/${examId}/bai-nop/${s.id}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: s.status === "GRADED" ? "outline" : "default" })
                      )}
                    >
                      {s.status === "GRADED" ? "Xem" : "Chấm bài"}
                    </Link>
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
