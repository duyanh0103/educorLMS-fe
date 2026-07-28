"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useClasses } from "@/hooks/use-classes";
import { ClassListCard } from "@/components/dashboard/class-list-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LIMIT = 12;

export default function LopHocPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useClasses({ page, limit: LIMIT, search });

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lớp Học</h1>
          {data && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {data.meta.total} lớp {search ? "phù hợp" : "đang hoạt động"}
            </p>
          )}
        </div>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên lớp..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {isError && <p className="text-sm text-destructive">Không tải được danh sách lớp.</p>}

      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">Không có lớp học nào.</p>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((c) => (
              <ClassListCard key={c.id} classItem={c} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
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
