"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Calendar,
  MapPin,
  Lightbulb,
  FolderKanban,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

const demoProfile: User = {
  id: "demo-1",
  email: "sarah@example.com",
  username: "sarahkim",
  avatar_url: null,
  bio: "Full-stack developer passionate about EdTech and AI. Building things that make learning accessible to everyone.",
  skills: ["React", "Python", "TensorFlow", "Next.js", "PostgreSQL", "UI/UX"],
  role: "user",
  reputation_score: 85,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const currentUser = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideasCount, setIdeasCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          setProfile(data);
        }

        const { count: iCount } = await supabase
          .from("ideas")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", id);
        setIdeasCount(iCount ?? 0);

        const { count: pCount } = await supabase
          .from("project_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", id);
        setProjectsCount(pCount ?? 0);
      } catch {
        // leave profile null
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#0A0A0F] transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>

        {/* Loading skeleton */}
        {loading && (
          <div className="glass-strong rounded-3xl border border-white/80 p-12 text-center animate-pulse" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
            <div className="w-24 h-24 bg-black/[0.06] rounded-full mx-auto mb-4" />
            <div className="h-4 bg-black/[0.06] rounded-full w-32 mx-auto mb-2" />
            <div className="h-3 bg-black/[0.04] rounded-full w-48 mx-auto" />
          </div>
        )}
        {!loading && !profile && (
          <div className="glass-strong rounded-3xl border border-white/80 p-12 text-center" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
            <p className="text-[#9CA3AF]">Profile not found.</p>
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <>
            <div className="glass-strong rounded-3xl border border-white/80 overflow-hidden" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-[#FF2D2D] via-[#FF6B6B] to-[#FF9A3C] relative">
                <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 30% 50%, white 0%, transparent 60%)"}} />
                <div className="absolute -bottom-12 left-6 sm:left-8">
                  <Avatar src={profile.avatar_url} name={profile.username} size="lg"
                    className="w-24 h-24 text-2xl border-4 border-white shadow-xl"
                  />
                </div>
              </div>

              <div className="pt-16 px-6 sm:px-8 pb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#0A0A0F] tracking-tight">{profile.username}</h1>
                    <p className="text-[#9CA3AF] text-sm">{profile.email}</p>
                  </div>
                  {isOwnProfile && (
                    <Link href="/profile/settings">
                      <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-black/[0.08] bg-white text-sm font-semibold text-[#374151] hover:border-[#FF2D2D]/30 transition-all cursor-pointer"
                        style={{boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}
                      >
                        <Settings className="w-4 h-4" />Edit Profile
                      </motion.button>
                    </Link>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-[#374151] mb-6 max-w-2xl leading-relaxed">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mb-6">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-7 h-7 rounded-xl bg-[#FFF0F0] flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-[#FF2D2D]" />
                    </span>
                    <span className="font-black text-[#0A0A0F]">{profile.reputation_score}</span>
                    <span className="text-[#9CA3AF]">rep</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>

                {profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#0A0A0F] mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="text-xs font-semibold px-3 py-1.5 bg-black/[0.04] text-[#374151] rounded-full border border-black/[0.06] hover:bg-[#FFF0F0] hover:text-[#FF2D2D] hover:border-red-100 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid md:grid-cols-2 gap-5 mt-6">
              {[
                { icon: Lightbulb, label: "Ideas Posted", count: ideasCount, color: "text-[#FF2D2D]", bg: "bg-[#FFF0F0]", bar: "from-[#FF2D2D] to-[#FF9A3C]" },
                { icon: FolderKanban, label: "Projects Joined", count: projectsCount, color: "text-emerald-500", bg: "bg-emerald-50", bar: "from-emerald-400 to-teal-500" },
              ].map((stat) => (
                <motion.div key={stat.label} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="glass-strong rounded-3xl border border-white/80 overflow-hidden"
                  style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${stat.bar}`} />
                  <div className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-[#0A0A0F]">{stat.count}</p>
                      <p className="text-sm text-[#9CA3AF] font-medium">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
