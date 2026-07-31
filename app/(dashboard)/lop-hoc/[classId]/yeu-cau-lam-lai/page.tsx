"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  useApproveRetakeRequest,
  useRejectRetakeRequest,
  useRetakeRequests,
} from "@/hooks/use-retake-request";
import { RetakeStatusBadge } from "@/components/retake/retake-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { RetakeRequestStatus } from "@/types/retake-request";
import { formatDateTimeVN } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const STATUS_TABS: { label: string; value: RetakeRequestStatus | "ALL" }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã từ chối", value: "REJECTED" },
];

export default function RetakeRequestsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const user = useAuthStore((s) => s.user);
  const [statusFilter, setStatusFilter] = useState<RetakeRequestStatus | "ALL">("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data, isLoading, isError } = useRetakeRequests(classId, statusFilter);
  const approveMutation = useApproveRetakeRequest();
  const rejectMutation = useRejectRetakeRequest();

  if (!user) return null;
  if (user.role === "STUDENT") {
    return <p className="text-sm text-destructive">Bạn không có quyền truy cập trang này.</p>;
  }

  function handleOpenReject(requestId: string) {
    setRejectingId(requestId);
    setReviewNote("");
  }

  async function handleConfirmReject() {
    if (!rejectingId) return;
    await rejectMutation.mutateAsync({ requestId: rejectingId, reviewNote });
    setRejectingId(null);
    setReviewNote("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/lop-hoc/${classId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại lớp học
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Yêu cầu làm lại bài thi</h1>
      </div>

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

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách yêu cầu.</p>}

      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{req.student.fullName}</span>
                    <span className="text-sm text-muted-foreground">({req.student.username})</span>
                    <RetakeStatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {req.exam.title} — Lần {req.submission.attemptNumber}
                    {req.submission.score !== null && ` — ${req.submission.score} điểm`}
                  </p>
                  {req.reason && <p className="text-sm">Lý do: {req.reason}</p>}
                  {req.status === "REJECTED" && req.reviewNote && (
                    <p className="text-sm text-destructive">Ghi chú từ chối: {req.reviewNote}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Gửi lúc {formatDateTimeVN(req.createdAt)}</p>
                </div>

                {req.status === "PENDING" && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleOpenReject(req.id)}
                    >
                      Từ chối
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                    >
                      Duyệt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối yêu cầu làm lại?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh sẽ không thể làm lại bài thi này. Bạn có thể ghi chú lý do từ chối (không bắt buộc).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            placeholder="Lý do từ chối..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
