"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Flame, Bell, LogOut,
  Zap, Shield, Briefcase, Crosshair, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar } from "./ui/avatar";

const navLinks = [
  { href: "/challenges", label: "Challenges", icon: Crosshair },
  { href: "/runs", label: "My Runs", icon: Flame },
  { href: "/my-work", label: "My Work", icon: Briefcase },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, unreadCount } = useAppStore();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().setUser(null);
    router.push("/");
  };

  const isLanding = pathname === "/";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-500",
        isLanding
          ? "border-white/[0.06] bg-[#050507]/60 backdrop-blur-xl"
          : "border-white/[0.06] bg-[#050507]/80 backdrop-blur-xl"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-9 h-9 bg-gradient-hero rounded-xl flex items-center justify-center shadow-lg shadow-[#FF3366]/20"
            >
              <Zap className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-xl font-black tracking-tight text-white">
              Build<span className="text-gradient">X</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-2xl p-1 border border-white/[0.06]">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-[#FF3366]"
                      : "text-[#94A3B8] hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/[0.06] rounded-xl border border-[#FF3366]/20"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="relative p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <Bell className="w-5 h-5 text-[#94A3B8]" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-hero text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#FF3366]/30"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="p-2.5 rounded-xl hover:bg-[#FF3366]/10 transition-colors"
                    title="Admin Panel"
                  >
                    <Shield className="w-5 h-5 text-[#FF3366]" />
                  </Link>
                )}

                <Link
                  href={`/profile/${user.id}`}
                  className="ml-1 ring-2 ring-transparent hover:ring-[#FF3366]/30 rounded-full transition-all"
                >
                  <Avatar src={user.avatar_url} name={user.username || "User"} size="sm" />
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#64748B]" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#94A3B8] hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/signup">
                  <motion.span
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex px-5 py-2.5 text-sm font-semibold bg-gradient-hero text-white rounded-xl shadow-lg shadow-[#FF3366]/30 cursor-pointer"
                  >
                    Get Started
                  </motion.span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right side — compact */}
          <div className="flex md:hidden items-center gap-1">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="p-2 rounded-xl hover:bg-[#FF3366]/10 transition-colors"
                    title="Admin Panel"
                  >
                    <Shield className="w-5 h-5 text-[#FF3366]" />
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#64748B]" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-[#94A3B8]"
                >
                  Sign in
                </Link>
                <Link href="/signup"
                  className="inline-flex px-4 py-2 text-sm font-semibold bg-gradient-hero text-white rounded-xl shadow-md shadow-[#FF3366]/30"
                >
                  Start
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
