"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamBalanceScore, IdeaRole } from "@/lib/types";

interface TeamBalanceIndicatorProps {
  roles: IdeaRole[];
  balance?: TeamBalanceScore | null;
  compact?: boolean;
}

const priorityOrder = { critical: 0, medium: 1, low: 2 };

export function TeamBalanceIndicator({
  roles,
  balance,
  compact = false,
}: TeamBalanceIndicatorProps) {
  if (!roles || roles.length === 0) return null;

  const sorted = [...roles].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const score = balance?.balance_score ?? 0;
  const label = balance?.label ?? "Poor";

  const scoreColor =
    score >= 80
      ? "text-emerald-600"
      : score >= 50
      ? "text-amber-500"
      : "text-red-500";

  const scoreBg =
    score >= 80
      ? "bg-emerald-50"
      : score >= 50
      ? "bg-amber-50"
      : "bg-red-50";

  const barColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-400"
      : "bg-[#FF2D2D]";

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {sorted.map((role) => {
          const full = role.current_count >= role.required_count;
          return (
            <div
              key={role.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                full
                  ? "bg-emerald-50 text-emerald-700"
                  : role.priority === "critical"
                  ? "bg-red-50 text-red-600"
                  : "bg-[#F7F7F9] text-[#64748B]"
              )}
            >
              {full ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {role.role_name}: {role.current_count}/{role.required_count}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Score */}
      {balance && (
        <div className={cn("rounded-2xl p-4 flex items-center gap-4", scoreBg)}>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#0F172A]">
                Team Balance Score
              </span>
              <span className={cn("text-sm font-bold", scoreColor)}>
                {score}% — {label}
              </span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.6 }}
                className={cn("h-full rounded-full", barColor)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Role Slots */}
      <div className="space-y-2">
        {sorted.map((role) => {
          const full = role.current_count >= role.required_count;
          const pct =
            role.required_count > 0
              ? Math.round((role.current_count / role.required_count) * 100)
              : 0;

          return (
            <div
              key={role.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F7F9]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#0F172A] truncate">
                      {role.role_name}
                    </span>
                    {role.priority === "critical" && !full && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                        Critical
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {full ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        full ? "text-emerald-600" : "text-[#64748B]"
                      )}
                    >
                      {role.current_count}/{role.required_count}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "h-full rounded-full",
                      full ? "bg-emerald-500" : "bg-[#FF2D2D]"
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missing roles summary */}
      {balance && balance.critical_gaps > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 font-medium">
            {balance.critical_gaps} critical role
            {balance.critical_gaps > 1 ? "s" : ""} still needed to start this
            project
          </p>
        </div>
      )}
    </div>
  );
}
