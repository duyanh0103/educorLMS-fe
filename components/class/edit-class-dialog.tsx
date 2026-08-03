"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateClass } from "@/hooks/use-class-mutations";
import { ApiRequestError } from "@/types/api";
import { Pencil } from "lucide-react";

interface EditClassDialogProps {
  classId: string;
  currentName: string;
  currentIsActive: boolean;
}

export function EditClassDialog({ classId, currentName, currentIsActive }: EditClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [isActive, setIsActive] = useState(currentIsActive);
  const [error, setError] = useState<string | null>(null);
  const updateClass = useUpdateClass(classId);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(currentName);
      setIsActive(currentIsActive);
      setError(null);
    }
    setOpen(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateClass.mutateAsync({ name, isActive });
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
            <Pencil className="mr-1.5 h-4 w-4" /> Sửa lớp
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thông tin lớp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="className">Tên lớp</Label>
            <Input id="className" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Đang hoạt động</Label>
            <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={updateClass.isPending}>
              {updateClass.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
