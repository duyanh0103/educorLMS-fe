import Link from "next/link";
import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClassCardProps {
  classId: string;
  name: string;
  courseName: string;
  studentCount?: number;
  isActive?: boolean;
}

export function ClassCard({ classId, name, courseName, studentCount, isActive }: ClassCardProps) {
  const active = isActive !== false;

  return (
    <Link href={`/lop-hoc/${classId}`}>
      <Card className="h-full cursor-pointer transition-colors hover:border-primary/50">
        <CardHeader>
          <div
            className={`flex h-[38px] w-[38px] items-center justify-center rounded-xl ${
              active ? "bg-[#FBE3E7] text-[#C81E3A]" : "bg-muted text-muted-foreground"
            }`}
          >
            <Layers className="h-[19px] w-[19px]" />
          </div>
          <div className="flex items-start justify-between gap-2 pt-1">
            <CardTitle className="text-base">{name}</CardTitle>
            {!active && <Badge variant="secondary">Ngừng hoạt động</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{courseName}</p>
          {typeof studentCount === "number" && (
            <p className="mt-2 text-xs text-muted-foreground">{studentCount} học sinh</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
