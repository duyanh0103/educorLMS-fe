"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface TeacherSelection {
  id: string;
  fullName: string;
  username: string;
}

interface TeacherAssignmentPickerProps {
  selected: Map<string, TeacherSelection>;
  primaryId: string;
  onSelectedChange: (selected: Map<string, TeacherSelection>) => void;
  onPrimaryChange: (id: string) => void;
}

export function TeacherAssignmentPicker({
  selected,
  primaryId,
  onSelectedChange,
  onPrimaryChange,
}: TeacherAssignmentPickerProps) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsers({ page: 1, limit: 20, role: "TEACHER", isActive: "true", search });

  function toggle(teacher: TeacherSelection) {
    const next = new Map(selected);
    if (next.has(teacher.id)) {
      next.delete(teacher.id);
      if (primaryId === teacher.id) onPrimaryChange("");
    } else {
      next.set(teacher.id, teacher);
    }
    onSelectedChange(next);
  }

  return (
    <div className="space-y-3">
      <Input placeholder="Tìm giáo viên..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {selected.size > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Chọn giáo viên chính (phụ trách chính):</p>
          <RadioGroup value={primaryId} onValueChange={onPrimaryChange}>
            {Array.from(selected.values()).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={t.id} id={`primary-${t.id}`} />
                <label htmlFor={`primary-${t.id}`} className="cursor-pointer">
                  {t.fullName}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
        {isLoading && <p className="p-3 text-sm text-muted-foreground">Đang tải...</p>}
        {data?.items.length === 0 && <p className="p-3 text-sm text-muted-foreground">Không tìm thấy giáo viên.</p>}
        {data?.items.map((u) => (
          <label key={u.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50">
            <Checkbox
              checked={selected.has(u.id)}
              onCheckedChange={() => toggle({ id: u.id, fullName: u.fullName, username: u.username })}
            />
            <div>
              <p className="text-sm font-medium">{u.fullName}</p>
              <p className="text-xs text-muted-foreground">{u.username}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
