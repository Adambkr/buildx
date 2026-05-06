"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crosshair, Users, Target, Trophy, Zap, ArrowRight,
  Flame, Sparkles, Rocket, ChevronRight, Star, Terminal,
  Code2, Palette, Globe, Cpu, Gamepad2, BarChart3
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ParticleHero } from "@/components/landing/particle-hero";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════
   LANDING PAGE — GAMIFIED CHALLENGE PLATFORM
   ═══════════════════════════════════════════ */

const steps = [
  { icon: Crosshair, title: "Discover", desc: "Find a challenge that matches your skills and ambition.", color: "text-[#FF3366]", bg: "bg-[#FF3366]/10", border: "border-[#FF3366]/20" },
  { icon: Users, title: "Assemble", desc: "Join or build a squad of skilled builders.", color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10", border: "border-[#00E5FF]/20" },
  { icon: Target, title: "Execute", desc: "Complete missions, track progress, hit milestones.", color: "text-[#A855F7]", bg: "bg-[#A855F7]/10", border: "border-[#A855F7]/20" },
  { icon: Trophy, title: "Showcase", desc: "Finish, earn XP, unlock badges, show the world.", color: "text-[#FFD700]", bg: "bg-[#FFD700]/10", border: "border-[#FFD700]/20" },
];

const featured = [
  { title: "AI Pair Programmer", category: "AI/ML", difficulty: "Advanced", squad: "3/5", icon: Code2, color: "from-[#FF3366] to-[#FF6B9D]", tags: ["AI", "Open Source"] },
  { title: "Web3 DAO Dashboard", category: "Web3", difficulty: "Intermediate", squad: "2/6", icon: Globe, color: "from-[#00E5FF] to-[#00B4D8]", tags: ["Solidity", "React"] },
  { title: "Real-time Collab Canvas", category: "Creative", difficulty: "Intermediate", squad: "4/8", icon: Palette, color: "from-[#A855F7] to-[#7C3AED]", tags: ["WebSocket", "Canvas"] },
  { title: "Edge Computing Router", category: "Infrastructure", difficulty: "Advanced", squad: "1/4", icon: Cpu, color: "from-[#FFD700] to-[#FFA500]", tags: ["Rust", "Networking"] },
];

const stats = [
  { value: "2,400+", label: "Challenges Launched", icon: Rocket },
  { value: "18,000+", label: "Squad Members", icon: Users },
  { value: "94%", label: "Completion Rate", icon: Target },
  { value: "12,500+", label: "Badges Earned", icon: Trophy },
];

const showcase = [
  { name: "Sarah K.", challenge: "AI Pair Programmer", badge: "Epic Coder", color: "#FF3366" },
  { name: "James L.", challenge: "Web3 DAO Dashboard", badge: "Chain Master", color: "#00E5FF" },
  { name: "Priya P.", challenge: "Real-time Canvas", badge: "Creative Force", color: "#A855F7" },
  { name: "Alex M.", challenge: "Edge Router", badge: "Speed Demon", color: "#FFD700" },
];

const categories = [
  { name: "AI / ML", icon: Terminal, count: 340 },
  { name: "Web3", icon: Globe, count: 210 },
  { name: "Creative", icon: Palette, count: 185 },
  { name: "Game Dev", icon: Gamepad2, count: 156 },
  { name: "Infra", icon: Cpu, count: 120 },
  { name: "Data", icon: BarChart3, count: 275 },
];

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative", className)}>
      {children}
    </section>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#050507] text-white overflow-hidden">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <Section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <ParticleHero />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050507] z-[1] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border border-[#FF3366]/20 mb-8">
              <Sparkles className="w-4 h-4 text-[#FF3366]" />
              <span className="text-sm font-medium text-[#94A3B8]">The gamified platform for builders</span>
            </div>

            <h1 className="display-hero mb-6">
              Discover Challenges.
              <br />
              <span className="text-gradient">Build. Compete. Win.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
              Join epic challenges, assemble your squad, complete missions, and showcase your wins to the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/challenges">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-hero text-white font-bold rounded-xl shadow-lg shadow-[#FF3366]/20 cursor-pointer text-lg"
                >
                  <Crosshair className="w-5 h-5" />
                  Start a Challenge
                </motion.span>
              </Link>
              <Link href="/challenges">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-8 py-4 glass-dark border border-white/[0.08] text-white font-semibold rounded-xl hover:border-[#00E5FF]/30 hover:bg-white/[0.04] transition-all cursor-pointer text-lg"
                >
                  <Flame className="w-5 h-5 text-[#00E5FF]" />
                  Explore Challenges
                </motion.span>
              </Link>
            </div>
          </motion.div>

          {/* Floating badges */}
          <motion.div
            className="hidden lg:block absolute -left-16 top-1/3 glass-dark rounded-2xl p-4 border border-[#FF3366]/10 animate-float"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3366] to-[#FF6B9D] flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">+500 XP</p>
                <p className="text-xs text-[#64748B]">Mission completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:block absolute -right-12 top-1/2 glass-dark rounded-2xl p-4 border border-[#00E5FF]/10 animate-float-slow"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00B4D8] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Squad Ready</p>
                <p className="text-xs text-[#64748B]">4 members joined</p>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <Section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="label-caps text-[#FF3366] mb-3 block">How It Works</span>
              <h2 className="heading-1 mb-4">From Discovery to Glory</h2>
              <p className="text-[#94A3B8] max-w-xl mx-auto">Four steps. One epic journey. Build real projects while leveling up your skills.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.1}>
                <div className="relative group">
                  <div className={cn(
                    "glass-dark rounded-2xl p-6 border transition-all duration-300 h-full",
                    step.border,
                    "hover:bg-white/[0.04]"
                  )}>
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", step.bg)}>
                      <step.icon className={cn("w-6 h-6", step.color)} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ChevronRight className="w-5 h-5 text-[#64748B] opacity-40" />
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════ CATEGORIES ═══════ */}
      <Section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="label-caps text-[#A855F7] mb-3 block">Categories</span>
              <h2 className="heading-1">Find Your Arena</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <FadeIn key={cat.name} delay={i * 0.05}>
                <Link href={`/challenges?category=${cat.name}`}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="glass-dark rounded-xl p-5 border border-white/[0.06] hover:border-[#A855F7]/20 transition-all cursor-pointer text-center group"
                  >
                    <cat.icon className="w-7 h-7 text-[#A855F7] mx-auto mb-3 group-hover:text-[#FF3366] transition-colors" />
                    <p className="text-sm font-semibold text-white mb-1">{cat.name}</p>
                    <p className="text-xs text-[#64748B]">{cat.count} challenges</p>
                  </motion.div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════ FEATURED CHALLENGES ═══════ */}
      <Section className="py-24 relative">
        <div className="absolute inset-0 bg-mesh-2 opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="label-caps text-[#00E5FF] mb-3 block">Trending Now</span>
                <h2 className="heading-1">Featured Challenges</h2>
              </div>
              <Link href="/challenges" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#FF3366] hover:text-[#FF6B9D] transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {featured.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden group cursor-pointer card-hover-glow"
                >
                  <div className={cn("h-1.5 w-full bg-gradient-to-r", f.color)} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", f.color)}>
                          <f.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white group-hover:text-[#FF3366] transition-colors">{f.title}</h3>
                          <p className="text-xs text-[#64748B]">{f.category}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full border",
                        f.difficulty === "Advanced"
                          ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20"
                          : "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20"
                      )}>
                        {f.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {f.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-medium px-2.5 py-0.5 bg-white/[0.04] text-[#94A3B8] rounded-full border border-white/[0.06]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-semibold text-white">{f.squad}</span> squad
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#FFD700] font-semibold">
                        <Star className="w-3.5 h-3.5 fill-[#FFD700]" />
                        500 XP
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link href="/challenges" className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF3366]">
              View All Challenges <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* ═══════ STATS ═══════ */}
      <Section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="glass-dark rounded-2xl p-6 border border-white/[0.06] text-center">
                  <stat.icon className="w-6 h-6 text-[#FF3366] mx-auto mb-3" />
                  <p className="text-2xl sm:text-3xl font-black text-gradient mb-1">{stat.value}</p>
                  <p className="text-xs text-[#94A3B8] font-medium">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════ SHOWCASE ═══════ */}
      <Section className="py-24 relative">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <span className="label-caps text-[#FFD700] mb-3 block">Hall of Fame</span>
              <h2 className="heading-1 mb-4">Builders Who Conquered</h2>
              <p className="text-[#94A3B8] max-w-lg mx-auto">Real people. Real challenges. Real wins. See who is leveling up right now.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {showcase.map((s, i) => (
              <FadeIn key={s.name} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-dark rounded-2xl p-5 border border-white/[0.06] text-center group cursor-pointer hover:border-white/[0.12] transition-all"
                >
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-xl"
                    style={{ background: `linear-gradient(135deg, ${s.color}40, ${s.color}20)`, border: `1px solid ${s.color}30` }}
                  >
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <h4 className="font-bold text-white mb-1">{s.name}</h4>
                  <p className="text-xs text-[#94A3B8] mb-3">{s.challenge}</p>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}25` }}
                  >
                    <Trophy className="w-3 h-3" /> {s.badge}
                  </span>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════ FINAL CTA ═══════ */}
      <Section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF3366]/[0.03] to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="glass-dark-strong rounded-3xl p-10 sm:p-14 border border-[#FF3366]/20"
            >
              <h2 className="heading-1 mb-4">Ready to Level Up?</h2>
              <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
                Join thousands of builders turning challenges into shipped projects. Your next adventure starts now.
              </p>
              <Link href="/challenges">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-hero text-white font-bold rounded-xl shadow-xl shadow-[#FF3366]/25 cursor-pointer text-lg animate-pulse-glow"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Your First Challenge
                </motion.span>
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </Section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">
                Build<span className="text-gradient">X</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#64748B]">
              <Link href="/challenges" className="hover:text-white transition-colors">Challenges</Link>
              <Link href="/runs" className="hover:text-white transition-colors">Runs</Link>
              <Link href="/my-work" className="hover:text-white transition-colors">My Work</Link>
            </div>
            <p className="text-xs text-[#475569]">BuildX Platform. Built for builders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

