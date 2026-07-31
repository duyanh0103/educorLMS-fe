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

// Response của POST /classes/:classId/exams và PATCH /exams/:id — đầy đủ field hơn Exam
// (dùng riêng cho các mutation tạo/cập nhật đề thi, không đụng tới type Exam đang dùng ở nơi khác).
export interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  creatorId: string;
  status: ExamStatus;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
