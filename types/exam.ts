export type ExamStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  status: ExamStatus;
  classId: string;
  createdAt: string;
  _count: { questions: number };
}
