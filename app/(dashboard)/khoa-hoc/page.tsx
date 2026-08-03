"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useCourses, useDeleteCourse } from "@/hooks/use-courses";
import { CourseFormDialog } from "@/components/course/course-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiRequestError } from "@/types/api";
import { Trash2 } from "lucide-react";

const LIMIT = 10;

export default function CoursesPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthorized = currentUser?.role === "SUPER_ADMIN";

  // Điều hướng là side effect — không gọi router.replace() trực tiếp trong render (không thuần khiết).
  useEffect(() => {
    if (currentUser && !isAuthorized) {
      router.replace("/trang-chu");
    }
  }, [currentUser, isAuthorized, router]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useCourses({ page, limit: LIMIT, search });
  const deleteCourse = useDeleteCourse();

  if (currentUser && !isAuthorized) return null;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleDelete(courseId: string, title: string, classCount: number) {
    if (classCount > 0) {
      alert(`Không thể xóa "${title}" vì đang có ${classCount} lớp học sử dụng khóa học này.`);
      return;
    }
    if (!window.confirm(`Xóa khóa học "${title}"? Không thể hoàn tác.`)) return;
    setError(null);
    try {
      await deleteCourse.mutateAsync(courseId);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Không thể xóa khóa học.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Khóa Học</h1>
        <CourseFormDialog />
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          placeholder="Tìm theo tên khóa học..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64"
        />
        <Button type="submit" variant="secondary">
          Tìm
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách khóa học.</p>}

      {data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khóa học</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số lớp</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{c.description ?? "—"}</TableCell>
                  <TableCell>
                    {c.isActive ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Ngừng hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell>{c._count.classes}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <CourseFormDialog existingCourse={c} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(c.id, c.title, c._count.classes)}
                      disabled={deleteCourse.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Không có khóa học nào.</p>
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
    </div>
  );
}
