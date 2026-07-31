import { Home, Layers, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navByRole: Record<Role, NavItem[]> = {
  STUDENT: [
    { label: "Trang Chủ", href: "/trang-chu", icon: Home },
  ],
  TEACHER: [
    { label: "Trang Chủ", href: "/trang-chu", icon: Home },
    { label: "Lớp Tôi Phụ Trách", href: "/lop-hoc", icon: Layers },
  ],
  SUPER_ADMIN: [
    { label: "Trang Chủ", href: "/trang-chu", icon: Home },
    { label: "Lớp Học", href: "/lop-hoc", icon: Layers },
    { label: "Quản Lý Người Dùng", href: "/nguoi-dung", icon: Users },
  ],
};
