"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeleteClass } from "@/hooks/use-class-mutations";
import { ApiRequestError } from "@/types/api";
import { Trash2 } from "lucide-react";

export function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  const router = useRouter();
  const deleteClass = useDeleteClass();

  async function handleDelete() {
    if (!window.confirm(`Xóa lớp "${className}"? Không thể hoàn tác.`)) return;
    try {
      await deleteClass.mutateAsync(classId);
      router.push("/lop-hoc");
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Không thể xóa lớp học.";
      alert(message);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteClass.isPending}>
      <Trash2 className="mr-1.5 h-4 w-4" /> Xóa lớp
    </Button>
  );
}
