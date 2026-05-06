"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
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
          className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />Back to Profile
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">Edit Profile</h1>
        <p className="text-[#64748B] mb-8 text-sm">Update your information and skills.</p>

        <div className="glass-dark rounded-2xl border border-white/[0.08] p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell the community about yourself..."
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Skills</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                }}
                className="flex-1 h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm"
              />
              <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                type="button" onClick={addSkill}
                className="flex-shrink-0 w-11 h-11 bg-gradient-hero text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#FF3366]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3366]/10 text-[#FF3366] text-xs font-semibold rounded-full border border-[#FF3366]/20"
                >
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="cursor-pointer hover:text-[#FF6B9D] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-xl text-sm text-[#FF3366] font-medium">
              {saveError}
            </div>
          )}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <motion.button whileHover={{scale:1.04, boxShadow:"0 6px 20px rgba(255,51,102,0.3)"}} whileTap={{scale:0.97}}
              onClick={handleSave} disabled={loading}
              className="bg-gradient-hero text-white px-8 py-3.5 sm:py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Changes"}
            </motion.button>
            {saved && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold text-[#00FFA3]"
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
