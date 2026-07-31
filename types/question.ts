export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "CODE";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  content: string;
  options: QuestionOption[] | null;
  // Backend ẩn hẳn field này (không phải null) khi trả về cho STUDENT — luôn optional-check.
  correctAnswer: string | null;
  score: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  score?: number;
  order?: number;
}
