import * as XLSX from "xlsx";

// Cột phải khớp CHÍNH XÁC với excelParser.js phía backend (đọc key theo đúng chữ trên dòng 1):
// type, content, optionA-D, correctAnswer, score.
export function downloadQuestionTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["type", "content", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "score"],
    ["MULTIPLE_CHOICE", "2 + 2 = ?", "3", "4", "5", "6", "B", 1],
    ["ESSAY", "Giải thích khái niệm biến trong lập trình.", "", "", "", "", "", 2],
  ]);
  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 35 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Câu hỏi");
  XLSX.writeFile(workbook, "template-import-cau-hoi.xlsx");
}
