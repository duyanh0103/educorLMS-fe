"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCourse, useUpdateCourse } from "@/hooks/use-courses";
import { ApiRequestError } from "@/types/api";
import type { Course } from "@/types/course";
import { Plus, Pencil } from "lucide-react";

interface CourseFormDialogProps {
  existingCourse?: Course;
}

export function CourseFormDialog({ existingCourse }: CourseFormDialogProps) {
  const isEdit = !!existingCourse;
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(existingCourse?.title ?? "");
  const [description, setDescription] = useState(existingCourse?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(existingCourse?.thumbnailUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse(existingCourse?.id ?? "");
  const isPending = isEdit ? updateCourse.isPending : createCourse.isPending;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTitle(existingCourse?.title ?? "");
      setDescription(existingCourse?.description ?? "");
      setThumbnailUrl(existingCourse?.thumbnailUrl ?? "");
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        title,
        description: description || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
      };
      if (isEdit) await updateCourse.mutateAsync(payload);
      else await createCourse.mutateAsync(payload);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Đã có lỗi xảy ra.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo khóa học
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa khóa học" : "Tạo khóa học mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên khóa học</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Ảnh thumbnail (URL)</Label>
            <Input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
