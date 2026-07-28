import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClassListItem } from "@/types/class";

export function ClassListCard({ classItem }: { classItem: ClassListItem }) {
  const primaryTeacher = classItem.teachers.find((t) => t.isPrimary)?.teacher;

  return (
    <Link href={`/lop-hoc/${classItem.id}`}>
      <Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{classItem.name}</CardTitle>
            {classItem.isActive ? (
              <Badge className="bg-[#DCFCE7] text-[#166534] hover:bg-[#DCFCE7]">Đang học</Badge>
            ) : (
              <Badge variant="secondary">Ngừng hoạt động</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground">{classItem.course.title}</p>
          <div className="my-3 h-px bg-border" />
          {primaryTeacher && (
            <p className="text-[12.5px] text-muted-foreground">GV phụ trách: {primaryTeacher.fullName}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[12.5px]">{classItem._count.enrollments} học sinh</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
