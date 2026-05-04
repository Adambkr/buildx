"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle, Eye, ArrowUpRight, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import type { Idea } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  index?: number;
  rankScore?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: "from-blue-400 to-indigo-500",
  design: "from-pink-400 to-rose-500",
  business: "from-amber-400 to-orange-500",
  health: "from-emerald-400 to-teal-500",
  education: "from-violet-400 to-purple-500",
  social: "from-cyan-400 to-blue-500",
  other: "from-gray-400 to-slate-500",
};

const STATUS_STYLES = {
  open: "bg-emerald-50 text-emerald-600 border-emerald-100",
  full: "bg-orange-50 text-orange-600 border-orange-100",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

export function IdeaCard({ idea, index = 0, rankScore }: IdeaCardProps) {
  const fillPct = Math.round((idea.current_members / (idea.max_members || 1)) * 100);
  const isAlmostFull = fillPct >= 80 && idea.status === "open";
  const catGradient = CATEGORY_COLORS[idea.category?.toLowerCase()] ?? CATEGORY_COLORS.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 120, damping: 18 }}
    >
      <Link href={`/ideas/${idea.id}`}>
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="group glass-strong rounded-3xl border border-white/80 overflow-hidden h-full flex flex-col cursor-pointer"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          {/* Colorful top bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${catGradient}`} />

          <div className="p-5 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar src={idea.creator?.avatar_url} name={idea.creator?.username || "User"} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-[#0A0A0F]">{idea.creator?.username || "Anonymous"}</p>
                  <p className="text-xs text-[#9CA3AF]" suppressHydrationWarning>{timeAgo(idea.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {rankScore !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-amber-50 to-orange-50 text-orange-500 border border-orange-100 rounded-full">
                    ✦ {rankScore}
                  </span>
                )}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[idea.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.closed}`}>
                  {isAlmostFull ? "🔥 Almost Full" : idea.status}
                </span>
              </div>
            </div>

            {/* Title & description */}
            <h3 className="text-base font-bold text-[#0A0A0F] mb-1.5 line-clamp-2 leading-snug group-hover:text-[#FF2D2D] transition-colors">
              {idea.title}
            </h3>
            <p className="text-sm text-[#6B7280] mb-4 line-clamp-2 flex-1 leading-relaxed">
              {idea.description}
            </p>

            {/* Skills */}
            {idea.required_skills && idea.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {idea.required_skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="text-[11px] font-medium px-2.5 py-0.5 bg-black/[0.05] text-[#374151] rounded-full">
                    {skill}
                  </span>
                ))}
                {idea.required_skills.length > 3 && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 bg-black/[0.05] text-[#9CA3AF] rounded-full">
                    +{idea.required_skills.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-black/[0.06]">
              <div className="flex items-center gap-3 text-[#9CA3AF]">
                <span className="flex items-center gap-1 text-xs">
                  <Heart className="w-3.5 h-3.5" />{idea.likes_count}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />{idea.comments_count}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Eye className="w-3.5 h-3.5" />{idea.views_count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span className="text-xs font-semibold text-[#374151]">{idea.current_members}/{idea.max_members}</span>
                </div>
                <div className="w-8 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${fillPct >= 80 ? "from-orange-400 to-red-500" : "from-emerald-400 to-teal-500"}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#FF2D2D] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
