"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/ideas");
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#A855F7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[400px] h-[400px] rounded-full bg-[#FF3366]/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-dark rounded-2xl border border-white/[0.08] p-8 sm:p-10 shadow-2xl shadow-black/50">

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-11 h-11 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF3366]/25">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Build<span className="text-gradient">X</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
            <p className="text-[#64748B] mt-1 text-sm">Start building something amazing</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors mb-6 cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#0D0D12] px-3 text-[#64748B] font-medium">or email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-xl text-sm text-[#FF3366]"
              >
                {error}
              </motion.div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input type="text" placeholder="Username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#FF3366]/40 transition-colors"
                required />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#FF3366]/40 transition-colors"
                required />
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input type={showPassword ? "text" : "password"} placeholder="Password (min 6 characters)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#FF3366]/40 transition-colors"
                  minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1">
                  {showPassword ? <EyeOff className="w-4 h-4 text-[#64748B]" /> : <Eye className="w-4 h-4 text-[#64748B]" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2 px-1">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map((n) => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= n * 3
                          ? n === 1 ? 'bg-[#FF3366]' : n === 2 ? 'bg-[#FFD700]' : 'bg-[#00FFA3]'
                          : 'bg-white/[0.06]'
                      }`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    password.length < 4 ? 'text-[#FF3366]' : password.length < 7 ? 'text-[#FFD700]' : 'text-[#00FFA3]'
                  }`}>
                    {password.length < 4 ? 'Weak' : password.length < 7 ? 'Fair' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(255,51,102,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 bg-gradient-hero text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer disabled:opacity-60 mt-1"
            >
              {loading ? "Creating account…" : "Create Account"}
            </motion.button>
          </form>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#FF3366] hover:text-[#FF6B9D] transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
