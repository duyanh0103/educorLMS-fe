"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TeacherAssignmentPicker, type TeacherSelection } from "./teacher-assignment-picker";
import { useUpdateClassTeachers } from "@/hooks/use-class-mutations";
import { ApiRequestError } from "@/types/api";
import type { ClassTeacher } from "@/types/class";
import { Users } from "lucide-react";

interface ManageTeachersDialogProps {
  classId: string;
  currentTeachers: ClassTeacher[];
}

function toSelectionMap(teachers: ClassTeacher[]): Map<string, TeacherSelection> {
  return new Map(
    teachers.map((t) => [t.teacherId, { id: t.teacherId, fullName: t.teacher.fullName, username: t.teacher.username }])
  );
}

export function ManageTeachersDialog({ classId, currentTeachers }: ManageTeachersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Map<string, TeacherSelection>>(() => toSelectionMap(currentTeachers));
  const [primaryId, setPrimaryId] = useState(currentTeachers.find((t) => t.isPrimary)?.teacherId ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateTeachers = useUpdateClassTeachers(classId);

  // Nạp lại đúng danh sách giáo viên hiện tại từ server mỗi lần mở dialog — tránh hiện lại
  // bản nháp cũ (bấm hủy không lưu, hoặc dữ liệu đã đổi từ nơi khác) thay vì trạng thái thật.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelected(toSelectionMap(currentTeachers));
      setPrimaryId(currentTeachers.find((t) => t.isPrimary)?.teacherId ?? "");
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleSubmit() {
    setError(null);
    try {
      await updateTeachers.mutateAsync({
        teacherIds: Array.from(selected.keys()),
        primaryTeacherId: primaryId || undefined,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Users className="mr-1.5 h-4 w-4" /> Quản lý giáo viên
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý giáo viên phụ trách</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Lưu ý: đây là thay thế toàn bộ danh sách giáo viên — bỏ chọn ai sẽ gỡ người đó khỏi lớp.
          </p>
          <TeacherAssignmentPicker
            selected={selected}
            primaryId={primaryId}
            onSelectedChange={setSelected}
            onPrimaryChange={setPrimaryId}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={selected.size === 0 || updateTeachers.isPending}>
              {updateTeachers.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
