"use client";

import { cn, getSlotColor } from "@/lib/utils";
import { Users } from "lucide-react";

interface SlotIndicatorProps {
  current: number;
  max: number;
  showAvatars?: boolean;
  className?: string;
}

export function SlotIndicator({
  current,
  max,
  className,
}: SlotIndicatorProps) {
  const percentage = (current / max) * 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Users className={cn("w-4 h-4", getSlotColor(current, max))} />
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-[#F7F7F9] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percentage >= 90
                ? "bg-[#FF2D2D]"
                : percentage >= 70
                ? "bg-orange-400"
                : "bg-emerald-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            getSlotColor(current, max)
          )}
        >
          {current}/{max}
        </span>
      </div>
    </div>
  );
}
