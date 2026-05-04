"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaFeed } from "@/components/ideas/idea-feed";
import { useState } from "react";

export default function IdeasPage() {
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
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0F] tracking-tight">
            Discover Ideas
          </h1>
          <p className="text-[#6B7280] mt-1 text-sm">
            Find your next project and join a team
          </p>
        </div>
        <Link href="/ideas/new">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 6px 20px rgba(255,45,45,0.25)" }}
            whileTap={{ scale: 0.97 }}
            className="gradient-bg text-white px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md shadow-red-200/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post an Idea
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Search ideas by title, skills, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all text-sm"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        />
      </motion.div>

      {/* Feed */}
      <IdeaFeed search={search} />
    </div>
  );
}
