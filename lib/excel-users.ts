import * as XLSX from "xlsx";
import type { BulkCreatedItem } from "@/types/bulk-user";

export interface ParsedUserRow {
  row: number; // 1-indexed, khớp với vị trí sẽ gửi lên backend
  fullName: string;
  roleRaw: string;
  roleNormalized: "TEACHER" | "STUDENT" | null;
  email: string | null;
}

// Bỏ dấu tiếng Việt để so khớp linh hoạt ("Học sinh", "hoc sinh", "HỌC SINH"...).
// Lọc theo codepoint dải combining diacritical marks (0x0300–0x036f) sau khi normalize NFD,
// thay vì regex \u escape, để tránh rủi ro sai lệch ký tự khi chỉnh sửa file nhiều lần.
const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

function stripDiacritics(str: string): string {
  return Array.from(str.normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < COMBINING_MARK_START || code > COMBINING_MARK_END;
    })
    .join("")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeRole(raw: string): "TEACHER" | "STUDENT" | null {
  const v = stripDiacritics(raw.trim().toLowerCase());
  if (["giao vien", "teacher", "gv"].includes(v)) return "TEACHER";
  if (["hoc sinh", "student", "hs"].includes(v)) return "STUDENT";
  return null;
}

export async function parseUsersExcel(file: File): Promise<ParsedUserRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return raw.map((r, idx) => {
    const fullName = String(r["Họ và Tên"] ?? r["Ho va Ten"] ?? "").trim();
    const roleRaw = String(r["Vai trò"] ?? r["Vai tro"] ?? "").trim();
    const emailRaw = String(r["Email"] ?? "").trim();

    return {
      row: idx + 1,
      fullName,
      roleRaw,
      roleNormalized: normalizeRole(roleRaw),
      email: emailRaw || null,
    };
  });
}

export function downloadUserTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Họ và Tên", "Vai trò", "Email"],
    ["Nguyễn Văn A", "Học sinh", "vana@example.com"],
    ["Trần Thị B", "Giáo viên", ""],
  ]);
  worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 30 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");
  XLSX.writeFile(workbook, "template-tao-tai-khoan.xlsx");
}

export function downloadCreatedUsersResult(created: BulkCreatedItem[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Username", "Họ và Tên", "Vai trò", "Mật khẩu"],
    ...created.map((c) => [c.user.username, c.user.fullName, c.user.role, c.initialPassword]),
  ]);
  worksheet["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tai khoan da tao");
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `tai-khoan-moi-${timestamp}.xlsx`);
}
