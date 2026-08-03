"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeacherAssignmentPicker, type TeacherSelection } from "./teacher-assignment-picker";
import { useCourses } from "@/hooks/use-courses";
import { useCreateClass } from "@/hooks/use-class-mutations";
import { useAuthStore } from "@/store/auth-store";
import { ApiRequestError } from "@/types/api";
import { Plus } from "lucide-react";

export function CreateClassDialog() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<Map<string, TeacherSelection>>(new Map());
  const [primaryTeacherId, setPrimaryTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: coursesData } = useCourses({ page: 1, limit: 100 });
  const createClass = useCreateClass();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName("");
      setCourseId("");
      setSelectedTeachers(new Map());
      setPrimaryTeacherId("");
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = isSuperAdmin
        ? {
            name,
            courseId,
            teacherIds: Array.from(selectedTeachers.keys()),
            primaryTeacherId: primaryTeacherId || undefined,
          }
        : { name, courseId };
      const newClass = await createClass.mutateAsync(payload);
      setOpen(false);
      router.push(`/lop-hoc/${newClass.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Tạo lớp học
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo lớp học mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên lớp</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Khóa học</Label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khóa học" />
              </SelectTrigger>
              <SelectContent>
                {coursesData?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin ? (
            <div className="space-y-2">
              <Label>Giáo viên phụ trách</Label>
              <TeacherAssignmentPicker
                selected={selectedTeachers}
                primaryId={primaryTeacherId}
                onSelectedChange={setSelectedTeachers}
                onPrimaryChange={setPrimaryTeacherId}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Bạn sẽ tự động là giáo viên phụ trách chính lớp này.</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={!courseId || createClass.isPending}>
              {createClass.isPending ? "Đang tạo..." : "Tạo lớp học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
