import type { Question } from "./question";

export interface ImportSkippedItem {
  // Luôn có field này, nhưng có thể null với lỗi cấp toàn file (không xác định được câu số mấy) —
  // verify qua code parser thật (excelParser/docxTableParser/pdfTextParser), không phải đoán.
  row: number | null;
  reason: string;
}

export interface ImportQuestionsResponse {
  importedCount: number;
  imported: Question[];
  skipped: ImportSkippedItem[];
}
