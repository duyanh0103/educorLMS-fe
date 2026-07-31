import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Luôn cố định timeZone khi format ngày giờ hiển thị trong JSX (SSR + client đều render ra
// cùng 1 chuỗi). Không cố định sẽ dùng timezone hệ thống của từng máy — server và trình duyệt
// thường lệch nhau, gây hydration mismatch ("server rendered HTML didn't match client").
export function formatDateTimeVN(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
