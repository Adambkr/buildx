"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, MessageCircle, Eye, ArrowUpRight, Users, Signal, Star, Crosshair } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Idea } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  index?: number;
  rankScore?: number;
}

const CAT_GRADIENTS: Record<string, string> = {
  "ai/ml": "from-[#FF3366] to-[#FF6B9D]",
  web3: "from-[#00E5FF] to-[#00B4D8]",
  creative: "from-[#A855F7] to-[#7C3AED]",
  infrastructure: "from-[#FFD700] to-[#FFA500]",
  food: "from-[#10B981] to-[#059669]",
  other: "from-[#64748B] to-[#475569]",
};

const STATUS_STYLES = {
  open: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20",
  in_progress: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20",
  full: "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20",
  closed: "bg-white/[0.03] text-[#64748B] border-white/[0.06]",
};

const DIFFICULTY_STYLES = {
  beginner: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20",
  intermediate: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20",
  advanced: "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20",
};

export function IdeaCard({ idea, index = 0, rankScore }: IdeaCardProps) {
  const fillPct = Math.round((idea.current_members / (idea.max_squad_size || 1)) * 100);
  const isAlmostFull = fillPct >= 80 && idea.status === "open";
  const catGradient = CAT_GRADIENTS[idea.category?.toLowerCase().replace(/[\/\s]/g, "")] ?? CAT_GRADIENTS.other;

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
          className="group glass-dark rounded-2xl border border-white/[0.06] overflow-hidden h-full flex flex-col cursor-pointer card-hover-glow"
        >
          {/* Neon top bar */}
          <div className={cn("h-1.5 w-full bg-gradient-to-r", catGradient)} />

          <div className="p-4 sm:p-5 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Avatar src={idea.creator?.avatar_url} name={idea.creator?.username || "User"} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-white">{idea.creator?.username || "Anonymous"}</p>
                  <p className="text-xs text-[#64748B]" suppressHydrationWarning>{timeAgo(idea.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {rankScore !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 rounded-full">
                    ✦ {rankScore}
                  </span>
                )}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[idea.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.closed}`}>
                  {isAlmostFull ? "🔥 Almost Full" : idea.status === "in_progress" ? "In Progress" : idea.status}
                </span>
              </div>
            </div>

            {/* Title & description */}
            <h3 className="text-base font-bold text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-[#FF3366] transition-colors">
              {idea.title}
            </h3>
            <p className="text-sm text-[#94A3B8] mb-4 line-clamp-2 flex-1 leading-relaxed">
              {idea.description}
            </p>

            {/* Difficulty + Tags + XP */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {idea.difficulty && (
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[idea.difficulty] ?? DIFFICULTY_STYLES.intermediate}`}>
                  <Signal className="w-2.5 h-2.5" />{idea.difficulty}
                </span>
              )}
              {idea.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-white/[0.03] text-[#64748B] rounded-full border border-white/[0.05]">
                  #{tag}
                </span>
              ))}
              {idea.xp_reward !== undefined && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded-full border border-[#FFD700]/20 ml-auto">
                  <Star className="w-2.5 h-2.5" />{idea.xp_reward} XP
                </span>
              )}
            </div>

            {/* Skills */}
            {idea.required_skills && idea.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {idea.required_skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="text-[11px] font-medium px-2.5 py-0.5 bg-white/[0.03] text-[#94A3B8] rounded-full border border-white/[0.04]">
                    {skill}
                  </span>
                ))}
                {idea.required_skills.length > 3 && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 bg-white/[0.03] text-[#64748B] rounded-full border border-white/[0.04]">
                    +{idea.required_skills.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-[#64748B]">
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
                  <Users className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="text-xs font-semibold text-white">{idea.current_members}/{idea.max_squad_size}</span>
                </div>
                <div className="w-8 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r", fillPct >= 80 ? "from-[#FF3366] to-[#FF6B9D]" : "from-[#00E5FF] to-[#00B4D8]")}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#FF3366] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
