import * as XLSX from "xlsx";

// Cột phải khớp CHÍNH XÁC với excelParser.js phía backend (đọc key theo đúng chữ trên dòng 1):
// type, content, contentImageUrl, optionA-F (+ optionXImageUrl cho từng lựa chọn),
// correctAnswer, score, difficultyLevel, skillTag.
// Ảnh không nhúng trực tiếp được vào cell Excel như .docx (xlsx không đọc drawing/embedded image) —
// dán URL ảnh đã upload sẵn (vd link Cloudinary) vào các cột *ImageUrl.
const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
const SAMPLE_OPTION_TEXT: Record<(typeof OPTION_KEYS)[number], string> = {
  A: "3",
  B: "4",
  C: "5",
  D: "6",
  E: "",
  F: "",
};

export function downloadQuestionTemplate() {
  const optionHeaders = OPTION_KEYS.flatMap((key) => [`option${key}`, `option${key}ImageUrl`]);
  const optionSampleRow1 = OPTION_KEYS.flatMap((key) => [SAMPLE_OPTION_TEXT[key], ""]);
  const optionSampleRow2 = OPTION_KEYS.flatMap(() => ["", ""]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    ["type", "content", "contentImageUrl", ...optionHeaders, "correctAnswer", "score", "difficultyLevel", "skillTag"],
    ["MULTIPLE_CHOICE", "2 + 2 = ?", "", ...optionSampleRow1, "B", 1, "NB", "Tư duy máy tính"],
    ["ESSAY", "Giải thích khái niệm biến trong lập trình.", "", ...optionSampleRow2, "", 2, "TH", ""],
  ]);
  worksheet["!cols"] = [
    { wch: 16 }, // type
    { wch: 35 }, // content
    { wch: 22 }, // contentImageUrl
    ...OPTION_KEYS.flatMap(() => [{ wch: 12 }, { wch: 22 }]), // optionX, optionXImageUrl
    { wch: 14 }, // correctAnswer
    { wch: 8 }, // score
    { wch: 14 }, // difficultyLevel
    { wch: 18 }, // skillTag
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Câu hỏi");
  XLSX.writeFile(workbook, "template-import-cau-hoi.xlsx");
}
