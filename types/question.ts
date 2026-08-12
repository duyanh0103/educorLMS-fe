export type QuestionType = "MULTIPLE_CHOICE" | "ESSAY" | "CODE";

export interface QuestionOption {
  key: string;
  text: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  content: string;
  contentImageUrl?: string;
  options: QuestionOption[] | null;
  // Backend ẩn hẳn field này (không phải null) khi trả về cho STUDENT — luôn optional-check.
  correctAnswer: string | null;
  score: number;
  order: number;
  // Chỉ có giá trị khi import từ file Word đúng template MindX — tạo thủ công thường để trống.
  difficultyLevel?: string;
  skillTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionPayload {
  type: QuestionType;
  content: string;
  contentImageUrl?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  score?: number;
  order?: number;
  difficultyLevel?: string;
  skillTag?: string;
}
