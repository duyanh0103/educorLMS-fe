import { Badge } from "@/components/ui/badge";
import type { RetakeRequestStatus } from "@/types/retake-request";

const statusConfig: Record<RetakeRequestStatus, { label: string; className: string }> = {
  PENDING: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Đã duyệt", className: "bg-primary/10 text-primary" },
  REJECTED: { label: "Đã từ chối", className: "bg-destructive/10 text-destructive" },
};

export function RetakeStatusBadge({ status }: { status: RetakeRequestStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
