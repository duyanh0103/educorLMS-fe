import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** solid = khối đỏ đậm nổi bật, soft = đỏ nhạt, plain = nền trắng (mặc định) */
  tone?: "solid" | "soft" | "plain";
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "plain", hint }: StatCardProps) {
  const isSolid = tone === "solid";
  const isSoft = tone === "soft";

  return (
    <Card
      className={
        isSolid
          ? "bg-[#9E1B3D] text-white ring-0"
          : isSoft
            ? "bg-[#FBE3E7] text-[#7A1230] ring-0"
            : undefined
      }
    >
      <CardContent>
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isSolid ? "bg-white/20" : isSoft ? "bg-[#C81E3A]/15" : "bg-muted"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${
                isSolid ? "text-white" : isSoft ? "text-[#9E1B3D]" : "text-muted-foreground"
              }`}
            />
          </div>
        )}
        <div className={`text-2xl font-extrabold mt-3.5 ${isSolid ? "text-white" : isSoft ? "text-[#7A1230]" : "text-foreground"}`}>
          {value}
        </div>
        <div className={`text-xs mt-0.5 ${isSolid ? "text-white/85" : isSoft ? "text-[#9E1B3D]" : "text-muted-foreground"}`}>
          {label}
        </div>
        {hint && (
          <p className={`text-xs mt-1 ${isSolid ? "text-white/70" : "text-muted-foreground"}`}>{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
