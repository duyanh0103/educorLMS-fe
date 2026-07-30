// "CODE" chưa có trong tài liệu Bước 6 nhưng xuất hiện thật trong dữ liệu backend
// (options: null, chấm tay giống ESSAY) — FE xử lý như câu tự luận (Textarea).
export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "CODE";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface SubmissionQuestion {
  id: string;
  examId: string;
  type: QuestionType;
  content: string;
  options: QuestionOption[] | null;
  score: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StartSubmissionResponse {
  id: string;
  attemptNumber: number;
  startedAt: string;
  durationMinutes: number;
  questions: SubmissionQuestion[];
}

export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface SubmitSubmissionResponse {
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
}
