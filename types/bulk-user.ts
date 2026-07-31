import type { UserDetail } from "./user";

export interface BulkUserInput {
  fullName: string;
  role: string; // gửi "TEACHER"/"STUDENT" nếu chuẩn hóa được, hoặc text gốc nếu không nhận diện được
  email?: string;
}

export interface BulkCreatedItem {
  row: number;
  user: UserDetail;
  initialPassword: string;
}

export interface BulkSkippedItem {
  row: number;
  // Backend trả null khi ô "Họ và Tên" gốc không phải string (vd để trống/kiểu số) — xem
  // user.service.js createUsersBulk, nhánh check độ dài tên.
  fullName: string | null;
  reason: string;
}

export interface BulkImportResponse {
  createdCount: number;
  skippedCount: number;
  created: BulkCreatedItem[];
  skipped: BulkSkippedItem[];
}
