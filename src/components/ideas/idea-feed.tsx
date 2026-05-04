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
  bio: null, skills: [], role: "user", reputation_score: rep, created_at: "",
});

const demoIdeas: Idea[] = [
  {
    id: "1",
    creator_id: "demo-1",
    title: "AI-Powered Study Companion",
    description:
      "Building an intelligent study app that uses AI to create personalized learning paths, generate flashcards from notes, and adapt to each student's learning pace. Looking for ML engineers and frontend devs.",
    category: "Education",
    required_skills: ["React", "Python", "Machine Learning", "UI/UX"],
    max_members: 8,
    current_members: 5,
    status: "open",
    likes_count: 124,
    comments_count: 18,
    applications_count: 12,
    views_count: 890,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-1", "sarahkim", 85),
  },
  {
    id: "2",
    creator_id: "demo-2",
    title: "Sustainable Marketplace Platform",
    description:
      "An eco-friendly marketplace connecting local artisans with conscious consumers. Features carbon-footprint tracking for each product and verified sustainability scores.",
    category: "E-Commerce",
    required_skills: ["Next.js", "Node.js", "PostgreSQL", "Stripe"],
    max_members: 10,
    current_members: 3,
    status: "open",
    likes_count: 89,
    comments_count: 12,
    applications_count: 5,
    views_count: 650,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-2", "jamesliu", 72),
  },
  {
    id: "3",
    creator_id: "demo-3",
    title: "Fitness Tracker with Social Challenges",
    description:
      "A fitness app where friends can create and join weekly challenges, track workouts with AI form correction, and compete on leaderboards. Think Strava meets Duolingo.",
    category: "Health",
    required_skills: ["React Native", "Firebase", "TensorFlow", "Design"],
    max_members: 6,
    current_members: 5,
    status: "open",
    likes_count: 201,
    comments_count: 34,
    applications_count: 8,
    views_count: 1240,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    creator: demoCreator("demo-3", "mikerod", 93),
  },
  {
    id: "4",
    creator_id: "demo-4",
    title: "Open-Source Developer Portfolio Builder",
    description:
      "A tool that auto-generates beautiful developer portfolios from GitHub activity, blog posts, and project contributions. One-click deploy to custom domains.",
    category: "Developer Tools",
    required_skills: ["TypeScript", "Next.js", "GitHub API", "Tailwind"],
    max_members: 5,
    current_members: 2,
    status: "open",
    likes_count: 156,
    comments_count: 22,
    applications_count: 6,
    views_count: 980,
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
    required_skills: ["Vue.js", "Python", "AWS", "Video Processing"],
    max_members: 7,
    current_members: 6,
    status: "open",
    likes_count: 78,
    comments_count: 9,
    applications_count: 10,
    views_count: 420,
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
    required_skills: ["Solidity", "React", "Node.js", "Smart Contracts"],
    max_members: 10,
    current_members: 9,
    status: "open",
    likes_count: 312,
    comments_count: 45,
    applications_count: 18,
    views_count: 2100,
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
        return b.current_members / b.max_members - a.current_members / a.max_members;
      }
      if (activeTab === "new") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 glass-strong rounded-2xl border border-white/80 p-1.5 mb-8 overflow-x-auto" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        {feedTabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "gradient-bg text-white shadow-md shadow-red-200/60"
                : "text-[#9CA3AF] hover:text-[#0A0A0F] hover:bg-black/[0.04]"
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
            <div key={i} className="glass-strong rounded-3xl border border-white/80 overflow-hidden animate-pulse" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <div className="h-1.5 w-full bg-black/[0.06]" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-black/[0.06] rounded-full" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3 bg-black/[0.06] rounded-full" />
                    <div className="w-16 h-2 bg-black/[0.04] rounded-full" />
                  </div>
                </div>
                <div className="w-3/4 h-4 bg-black/[0.06] rounded-full mb-2.5" />
                <div className="w-full h-3 bg-black/[0.04] rounded-full mb-1.5" />
                <div className="w-2/3 h-3 bg-black/[0.04] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20">
          <p className="text-[#9CA3AF] font-medium">
            {q ? `No ideas matching "${search}"` : "No ideas yet — be the first to post one!"}
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
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
