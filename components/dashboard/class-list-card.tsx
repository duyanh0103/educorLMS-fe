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
        <CardContent className="flex flex-1 flex-col">
          <p className="text-sm text-muted-foreground">{classItem.course.title}</p>

          {/* Ghim khối GV/số học sinh xuống đáy card, để thẳng hàng giữa các card dù có/không có GV phụ trách */}
          <div className="mt-auto pt-3">
            <div className="h-px bg-border" />
            {primaryTeacher && (
              <p className="mt-3 text-[12.5px] text-muted-foreground">
                GV phụ trách: {primaryTeacher.fullName}
              </p>
            )}
            <div className={`flex items-center gap-1.5 text-muted-foreground ${primaryTeacher ? "mt-2" : "mt-3"}`}>
              <Users className="h-3.5 w-3.5" />
              <span className="text-[12.5px]">{classItem._count.enrollments} học sinh</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
