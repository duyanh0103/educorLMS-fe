export type RetakeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RetakeRequest {
  id: string;
  examId: string;
  submissionId: string;
  studentId: string;
  status: RetakeRequestStatus;
  reason: string | null;
  reviewNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Item của GET /classes/:classId/retake-requests — kèm thông tin rút gọn exam/student/submission.
export interface RetakeRequestListItem extends RetakeRequest {
  exam: { id: string; title: string };
  student: { id: string; fullName: string; username: string };
  submission: { id: string; attemptNumber: number; score: number | null; status: string };
}
