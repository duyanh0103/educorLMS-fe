"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { useUsers, useToggleUserStatus, useResetPassword } from "@/hooks/use-users";
import { CreateUserDialog } from "@/components/user/create-user-dialog";
import { PasswordRevealDialog } from "@/components/user/password-reveal-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApiRequestError } from "@/types/api";
import { Upload } from "lucide-react";

const LIMIT = 10;

export default function UsersPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthorized = currentUser?.role === "SUPER_ADMIN";

  // Điều hướng là side effect — không gọi router.replace() trực tiếp trong render (không thuần khiết).
  // Render vẫn short-circuit về null ngay bên dưới để không lộ nội dung trang trong lúc chờ effect chạy.
  useEffect(() => {
    if (currentUser && !isAuthorized) {
      router.replace("/trang-chu");
    }
  }, [currentUser, isAuthorized, router]);

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useUsers({
    page,
    limit: LIMIT,
    role: roleFilter !== "ALL" ? roleFilter : undefined,
    isActive: statusFilter !== "ALL" ? statusFilter : undefined,
    search,
  });

  const toggleStatus = useToggleUserStatus();
  const resetPassword = useResetPassword();

  const [statusError, setStatusError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealData, setRevealData] = useState<{ username: string; password: string } | null>(null);

  if (!currentUser || !isAuthorized) return null;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleToggleStatus(userId: string, currentActive: boolean, username: string) {
    const action = currentActive ? "khóa" : "mở khóa";
    if (!window.confirm(`Xác nhận ${action} tài khoản "${username}"?`)) return;
    setStatusError(null);
    try {
      await toggleStatus.mutateAsync({ userId, isActive: !currentActive });
    } catch (err) {
      setStatusError(err instanceof ApiRequestError ? err.message : `Không thể ${action} tài khoản.`);
    }
  }

  async function handleResetPassword(userId: string, username: string) {
    if (!window.confirm(`Reset mật khẩu cho "${username}"? Mật khẩu cũ sẽ không còn dùng được.`)) return;
    setResetError(null);
    try {
      const result = await resetPassword.mutateAsync(userId);
      setRevealData({ username, password: result.newPassword });
      setRevealOpen(true);
    } catch (err) {
      setResetError(err instanceof ApiRequestError ? err.message : "Không thể reset mật khẩu.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Quản Lý Người Dùng</h1>
        <div className="flex items-center gap-2">
          {/* buttonVariants() trực tiếp trên <Link> — Base UI Button không có "asChild". */}
          <Link
            href="/nguoi-dung/nhap-hang-loat"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Upload className="mr-1.5 h-4 w-4" /> Nhập từ Excel
          </Link>
          <CreateUserDialog />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            placeholder="Tìm theo tên/username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        <Select
          value={roleFilter}
          onValueChange={(v) => {
            if (!v) return;
            setRoleFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="TEACHER">Giáo viên</SelectItem>
            <SelectItem value="STUDENT">Học sinh</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            if (!v) return;
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Đã khóa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {statusError && <p className="text-sm text-destructive">{statusError}</p>}
      {resetError && <p className="text-sm text-destructive">{resetError}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách người dùng.</p>}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabel(u.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge className="bg-primary/10 text-primary">Đang hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Đã khóa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(u.id, u.username)}
                      disabled={resetPassword.isPending}
                    >
                      Reset MK
                    </Button>
                    {u.role !== "SUPER_ADMIN" && (
                      <Button
                        size="sm"
                        variant={u.isActive ? "destructive" : "outline"}
                        onClick={() => handleToggleStatus(u.id, u.isActive, u.username)}
                        disabled={toggleStatus.isPending}
                      >
                        {u.isActive ? "Khóa" : "Mở khóa"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy người dùng nào.</p>
          )}

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {data.meta.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {revealData && (
        <PasswordRevealDialog
          open={revealOpen}
          onOpenChange={setRevealOpen}
          username={revealData.username}
          password={revealData.password}
        />
      )}
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "TEACHER") return "Giáo viên";
  return "Học sinh";
}
