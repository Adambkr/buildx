"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSettingsPage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (username.trim().length < 3) { setSaveError("Username must be at least 3 characters."); return; }
    setLoading(true);
    setSaveError("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ username, bio, skills })
        .eq("id", user.id);

      if (error) throw error;
      setUser({ ...user, username, bio, skills });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href={`/profile/${user?.id || ""}`}
          className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#0A0A0F] transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />Back to Profile
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0F] tracking-tight mb-1">Edit Profile</h1>
        <p className="text-[#9CA3AF] mb-8 text-sm">Update your information and skills.</p>

        <div className="glass-strong rounded-3xl border border-white/80 p-6 sm:p-8 space-y-6"
          style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div>
            <label className="block text-sm font-bold text-[#0A0A0F] mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell the community about yourself..."
              className="w-full px-4 py-3 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all resize-none text-sm"
              style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0A0A0F] mb-1.5">Skills</label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                }}
              />
              <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                type="button" onClick={addSkill}
                className="flex-shrink-0 w-10 h-10 gradient-bg text-white rounded-2xl flex items-center justify-center shadow-md shadow-red-200/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F0] text-[#FF2D2D] text-xs font-semibold rounded-full border border-red-100"
                >
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="cursor-pointer hover:text-red-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
              {saveError}
            </div>
          )}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <motion.button whileHover={{scale:1.04, boxShadow:"0 6px 20px rgba(255,45,45,0.3)"}} whileTap={{scale:0.97}}
              onClick={handleSave} disabled={loading}
              className="gradient-bg text-white px-8 py-3.5 sm:py-3 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Changes"}
            </motion.button>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold text-emerald-500"
              >
                ✓ Saved!
              </motion.span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
