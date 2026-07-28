import { Badge } from "@/components/ui/badge";
import type { ExamStatus } from "@/types/exam";

const statusConfig: Record<ExamStatus, { label: string; className: string }> = {
  DRAFT: { label: "Nháp", className: "bg-muted text-muted-foreground" },
  PUBLISHED: { label: "Đã xuất bản", className: "bg-primary/10 text-primary" },
  CLOSED: { label: "Đã đóng", className: "bg-secondary text-secondary-foreground" },
};

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
