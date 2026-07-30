export type ExamStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  status: ExamStatus;
  classId: string;
  createdAt: string;
  // Có ở GET /classes/:classId/exams (list); KHÔNG có ở GET /exams/:id (detail) — luôn optional-check.
  _count?: { questions: number };
}
