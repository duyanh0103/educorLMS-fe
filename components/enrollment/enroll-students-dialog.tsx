"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUsers } from "@/hooks/use-users";
import { useEnrollStudents } from "@/hooks/use-enrollments";
import { ApiRequestError } from "@/types/api";
import type { EnrollResult } from "@/types/enrollment";
import { UserPlus } from "lucide-react";

interface SelectedStudent {
  id: string;
  fullName: string;
  username: string;
}

export function EnrollStudentsDialog({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<string, SelectedStudent>>(new Map());
  const [submittedSelection, setSubmittedSelection] = useState<Map<string, SelectedStudent>>(new Map());
  const [result, setResult] = useState<EnrollResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useUsers({ page: 1, limit: 20, role: "STUDENT", isActive: "true", search });
  const enrollStudents = useEnrollStudents(classId);

  function toggleSelect(student: SelectedStudent) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, student);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    try {
      const data = await enrollStudents.mutateAsync(Array.from(selected.keys()));
      setResult(data);
      setSubmittedSelection(selected);
      setSelected(new Map());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  function handleClose(openState: boolean) {
    setOpen(openState);
    if (!openState) {
      setResult(null);
      setError(null);
      setSearch("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" /> Ghi danh học sinh
          </Button>
        }
      />
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ghi danh học sinh vào lớp</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <Input
              placeholder="Tìm theo tên hoặc username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {selected.size > 0 && (
              <p className="text-sm text-muted-foreground">Đã chọn {selected.size} học sinh</p>
            )}

            <div className="max-h-64 divide-y overflow-y-auto rounded-md border">
              {isLoading && <p className="p-3 text-sm text-muted-foreground">Đang tải...</p>}
              {data?.items.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Không tìm thấy học sinh.</p>
              )}
              {data?.items.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50">
                  <Checkbox
                    checked={selected.has(u.id)}
                    onCheckedChange={() => toggleSelect({ id: u.id, fullName: u.fullName, username: u.username })}
                  />
                  <div>
                    <p className="text-sm font-medium">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">{u.username}</p>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={selected.size === 0 || enrollStudents.isPending}>
                {enrollStudents.isPending ? "Đang ghi danh..." : `Ghi danh ${selected.size} học sinh`}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              Đã ghi danh thành công <strong className="text-primary">{result.enrolled.length}</strong> học sinh
              {result.skipped.length > 0 && (
                <>
                  , bỏ qua <strong className="text-destructive">{result.skipped.length}</strong>
                </>
              )}
              .
            </p>
            {result.skipped.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {result.skipped.map((s) => (
                  <li key={s.studentId} className="text-destructive">
                    {submittedSelection.get(s.studentId)?.fullName ?? s.studentId}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>
                Ghi danh thêm
              </Button>
              <Button onClick={() => handleClose(false)}>Đóng</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
