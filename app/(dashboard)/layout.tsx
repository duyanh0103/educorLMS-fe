"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, Search, Bell, LogOut, UserRound, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { navByRole } from "@/lib/nav-config";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";

const SECTION_LABEL: Record<string, string> = {
  "/trang-chu": "Tổng quan",
  "/lop-hoc": "Danh sách",
  "/khoa-hoc": "Danh sách",
  "/nguoi-dung": "Danh sách",
  "/ho-so": "Cá nhân",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  if (!user) return null;

  const items = navByRole[user.role];
  const activeItem = items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const sectionLabel = SECTION_LABEL[pathname];

  async function handleLogout() {
    await apiClient("/auth/logout", { method: "POST" }).catch(() => {});
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="flex h-screen">
      <aside
        className={`flex shrink-0 flex-col gap-0.5 border-r border-sidebar-border bg-sidebar p-3.5 transition-[width] duration-200 ${
          collapsed ? "w-17" : "w-55"
        }`}
      >
        <div className={`flex items-center gap-2.5 px-2.5 pt-1.5 pb-5 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary">
            <BookOpen className="h-[18px] w-[18px] text-primary-foreground" />
          </div>
          {!collapsed && <div className="text-[15px] font-extrabold text-foreground">EduCore</div>}
        </div>
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
            Menu
          </div>
        )}
        <nav className="flex-1 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mx-1 my-2 h-px bg-sidebar-border" />
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
          {!collapsed && "Thu gọn menu"}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? "Đăng Xuất" : undefined}
          className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-muted-foreground hover:bg-sidebar-accent/50 hover:text-destructive ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Đăng Xuất"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-7">
          <div className="text-sm font-semibold text-foreground">
            {activeItem?.label ?? "EduCore"}
            {sectionLabel && (
              <span className="font-normal text-muted-foreground"> / {sectionLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <div className="relative">
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              <div className="absolute -top-0.5 -right-0.5 h-[7px] w-[7px] rounded-full bg-destructive" />
            </div>
            <div className="h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-1 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <Avatar>
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                  <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[12.5px] font-semibold text-foreground">{user.fullName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/ho-so" />}>
                  <UserRound className="h-4 w-4" /> Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Đăng Xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#FAFAF9] p-7">{children}</main>
      </div>
    </div>
  );
}
