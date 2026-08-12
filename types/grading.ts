import type { SubmissionQuestion, SubmissionStatus } from "./submission";

export interface GradingQuestion extends SubmissionQuestion {
  correctAnswer: string | null;
}

export interface SubmissionListItem {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  answers: Record<string, string>;
  autoScore: number;
  manualScore: number | null;
  score: number | null;
  status: SubmissionStatus;
  gradedById: string | null;
  startedAt: string;
  submittedAt: string;
  gradedAt: string | null;
  createdAt: string;
  student: { id: string; fullName: string; username: string };
}

export interface SubmissionDetail extends SubmissionListItem {
  questions: GradingQuestion[];
}

export interface GradeSubmissionPayload {
  manualScore: number;
}

// Response thật của PATCH /submissions/:id/grade KHÔNG có "student"/"questions" như
// SubmissionDetail (đã verify qua API thật) — dùng riêng type này thay vì tái dùng SubmissionDetail
// để không khai khống field không tồn tại.
export type GradeSubmissionResponse = Omit<SubmissionListItem, "student">;
