"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Search, Crosshair, Flame } from "lucide-react";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import { useState } from "react";

export default function ChallengesPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-[#FF3366]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Discover Challenges
            </h1>
          </div>
          <p className="text-[#64748B] mt-1 text-sm">
            Find your next mission and assemble your squad
          </p>
        </div>
        <Link href="/ideas/new">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(255,51,102,0.25)" }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-hero text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#FF3366]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Launch Challenge
          </motion.button>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-5 sm:mb-8"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          placeholder="Search challenges by title, skills, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 focus:ring-1 focus:ring-[#FF3366]/10 transition-all text-sm"
        />
      </motion.div>

      {/* Feed */}
      <IdeaFeed search={search} />
    </div>
  );
}
