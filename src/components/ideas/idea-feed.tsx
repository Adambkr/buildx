"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Clock, Sparkles, AlertCircle, Zap } from "lucide-react";
import { IdeaCard } from "./idea-card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Idea, FeedType, User } from "@/lib/types";

const feedTabs: { id: FeedType; label: string; icon: React.ElementType }[] = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "new", label: "New", icon: Clock },
  { id: "for-you", label: "For You", icon: Sparkles },
  { id: "almost-full", label: "Almost Full", icon: AlertCircle },
];

// Demo data for when Supabase is not connected
const demoCreator = (id: string, username: string, rep: number): User => ({
  id, email: `${username}@example.com`, username, avatar_url: null,
  bio: null, skills: [], role: "user", reputation_score: rep,
  xp: rep * 12, level: Math.floor(rep / 20) + 1, created_at: "",
});

const demoIdeas: Idea[] = [
  {
    id: "1",
    creator_id: "demo-1",
    title: "AI Pair Programmer Challenge",
    description:
      "Build an AI-powered pair programming tool that suggests completions, detects bugs, and explains code in real-time. Looking for ML engineers and frontend devs.",
    category: "AI/ML",
    difficulty: "intermediate",
    duration: "2_weeks",
    tags: ["ai", "vscode-extension", "llm"],
    required_skills: ["React", "Python", "Machine Learning", "UI/UX"],
    max_squad_size: 8,
    current_members: 5,
    status: "open",
    likes_count: 124,
    comments_count: 18,
    applications_count: 12,
    views_count: 890,
    xp_reward: 500,
    badge_reward: "AI Architect",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-1", "sarahkim", 85),
  },
  {
    id: "2",
    creator_id: "demo-2",
    title: "Web3 DAO Dashboard",
    description:
      "Create a real-time DAO governance dashboard with proposal voting, treasury analytics, and member reputation tracking. Powered by smart contracts.",
    category: "Web3",
    difficulty: "advanced",
    duration: "1_month",
    tags: ["solidity", "defi", "governance"],
    required_skills: ["Next.js", "Node.js", "PostgreSQL", "Solidity"],
    max_squad_size: 10,
    current_members: 3,
    status: "open",
    likes_count: 89,
    comments_count: 12,
    applications_count: 5,
    views_count: 650,
    xp_reward: 800,
    badge_reward: "Chain Master",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-2", "jamesliu", 72),
  },
  {
    id: "3",
    creator_id: "demo-3",
    title: "Real-time Collab Canvas",
    description:
      "Build a multiplayer collaborative canvas with cursors, drawing tools, voice chat, and export to Figma. Think Miro meets Discord.",
    category: "Creative",
    difficulty: "advanced",
    duration: "2_weeks",
    tags: ["websocket", "canvas", "webrtc"],
    required_skills: ["React Native", "Firebase", "TensorFlow", "Design"],
    max_squad_size: 6,
    current_members: 5,
    status: "open",
    likes_count: 201,
    comments_count: 34,
    applications_count: 8,
    views_count: 1240,
    xp_reward: 600,
    badge_reward: "Creative Force",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-3", "mikerod", 93),
  },
  {
    id: "4",
    creator_id: "demo-4",
    title: "Edge Computing Router",
    description:
      "Design a lightweight edge computing router for IoT devices with auto-scaling, zero-config mesh networking, and WASM plugin support.",
    category: "Infrastructure",
    difficulty: "beginner",
    duration: "weekend",
    tags: ["rust", "iot", "wasm"],
    required_skills: ["TypeScript", "Next.js", "GitHub API", "Tailwind"],
    max_squad_size: 5,
    current_members: 2,
    status: "open",
    likes_count: 156,
    comments_count: 22,
    applications_count: 6,
    views_count: 980,
    xp_reward: 300,
    badge_reward: "Speed Demon",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-4", "priyapatel", 67),
  },
  {
    id: "5",
    creator_id: "demo-5",
    title: "Community Recipe Sharing App",
    description:
      "A platform for home cooks to share recipes with step-by-step video guides, ingredient scaling, and AI-powered meal planning based on what's in your fridge.",
    category: "Food",
    difficulty: "intermediate",
    duration: "1_week",
    tags: ["food", "community", "video"],
    required_skills: ["Vue.js", "Python", "AWS", "Video Processing"],
    max_squad_size: 7,
    current_members: 6,
    status: "open",
    likes_count: 78,
    comments_count: 9,
    applications_count: 10,
    views_count: 420,
    xp_reward: 400,
    badge_reward: null,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-5", "emmawilson", 58),
  },
  {
    id: "6",
    creator_id: "demo-6",
    title: "Decentralized Freelance Marketplace",
    description:
      "Building a Web3-powered freelance platform with smart contract escrow, reputation tokens, and zero platform fees. Empowering freelancers worldwide.",
    category: "Web3",
    difficulty: "advanced",
    duration: "1_month",
    tags: ["web3", "freelance", "defi"],
    required_skills: ["Solidity", "React", "Node.js", "Smart Contracts"],
    max_squad_size: 10,
    current_members: 9,
    status: "open",
    likes_count: 312,
    comments_count: 45,
    applications_count: 18,
    views_count: 2100,
    xp_reward: 1000,
    badge_reward: "DeFi Pioneer",
    created_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-6", "alexchen", 98),
  },
];

interface IdeaFeedProps {
  search?: string;
}

export function IdeaFeed({ search = "" }: IdeaFeedProps) {
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<FeedType>("trending");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [rankedScores, setRankedScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ideas/ranked?feed=${activeTab}&limit=20`);
        if (res.ok) {
          const json = await res.json();
          const data: (Idea & { _score?: number })[] = json.ideas ?? [];
          const scores = Object.fromEntries(
            data.map((idea) => [idea.id, Math.round(idea._score ?? 0)])
          );
          setRankedScores(scores);
          setIdeas(data);
          setDataLoaded(true);
          return;
        }
      } catch {
        // fall through to demo
      }
      if (!dataLoaded) setIdeas(demoIdeas);
      setDataLoaded(true);
      setLoading(false);
    };

    fetchIdeas().finally(() => setLoading(false));
  }, [activeTab, user]);

  const q = search.toLowerCase();
  const filteredIdeas = [...ideas]
    .filter((idea) => {
      if (!q) return true;
      return (
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.category?.toLowerCase().includes(q) ||
        idea.required_skills?.some((s) => s.toLowerCase().includes(q)) ||
        idea.creator?.username?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (activeTab === "almost-full") {
        return b.current_members / b.max_squad_size - a.current_members / a.max_squad_size;
      }
      if (activeTab === "new") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 glass-dark rounded-2xl border border-white/[0.06] p-1 sm:p-1.5 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        {feedTabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-gradient-hero text-white shadow-lg shadow-[#FF3366]/20"
                : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden animate-pulse">
              <div className="h-1.5 w-full bg-white/[0.04]" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-white/[0.04] rounded-full" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3 bg-white/[0.04] rounded-full" />
                    <div className="w-16 h-2 bg-white/[0.03] rounded-full" />
                  </div>
                </div>
                <div className="w-3/4 h-4 bg-white/[0.04] rounded-full mb-2.5" />
                <div className="w-full h-3 bg-white/[0.03] rounded-full mb-1.5" />
                <div className="w-2/3 h-3 bg-white/[0.03] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20">
          <p className="text-[#94A3B8] font-medium">
            {q ? `No challenges matching "${search}"` : "No challenges yet — be the first to launch one!"}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + q}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredIdeas.map((idea, i) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                index={i}
                rankScore={rankedScores[idea.id]}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
