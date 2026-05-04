"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, FolderKanban, Bell, LogOut,
  Menu, X, Zap, Shield, Briefcase,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Avatar } from "./ui/avatar";

const navLinks = [
  { href: "/ideas", label: "Discover", icon: Lightbulb },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-work", label: "My Work", icon: Briefcase },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, unreadCount } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAppStore.getState().setUser(null);
    router.push("/");
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-50 glass-strong border-b border-white/60"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="w-9 h-9 gradient-bg rounded-2xl flex items-center justify-center shadow-md shadow-red-200"
              >
                <Zap className="w-4.5 h-4.5 text-white fill-white" />
              </motion.div>
              <span className="text-xl font-black tracking-tight text-[#0A0A0F]">
                Build<span className="gradient-text">X</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] rounded-2xl p-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-[#FF2D2D]"
                        : "text-[#6B7280] hover:text-[#0A0A0F]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm"
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

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative p-2.5 rounded-xl hover:bg-black/[0.05] transition-colors"
                  >
                    <Bell className="w-5 h-5 text-[#6B7280]" />
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-0.5 -right-0.5 w-5 h-5 gradient-bg text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="p-2.5 rounded-xl hover:bg-red-50 transition-colors"
                      title="Admin Panel"
                    >
                      <Shield className="w-5 h-5 text-[#FF2D2D]" />
                    </Link>
                  )}

                  <Link
                    href={`/profile/${user.id}`}
                    className="ml-1 ring-2 ring-transparent hover:ring-red-200 rounded-full transition-all"
                  >
                    <Avatar src={user.avatar_url} name={user.username || "User"} size="sm" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="p-2.5 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5 text-[#9CA3AF]" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#0A0A0F] transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link href="/signup">
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex px-5 py-2.5 text-sm font-semibold gradient-bg text-white rounded-2xl shadow-lg shadow-red-200/50 cursor-pointer"
                    >
                      Get Started
                    </motion.span>
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer ml-1"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 top-16 z-40 glass-strong border-b border-white/60 md:hidden"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map((link, i) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-red-50 to-orange-50 text-[#FF2D2D]"
                          : "text-[#6B7280] hover:bg-black/[0.04] hover:text-[#0A0A0F]"
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              {user ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="pt-2 mt-2 border-t border-black/[0.06] flex items-center justify-between px-2">
                  <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3">
                    <Avatar src={user.avatar_url} name={user.username || "User"} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-[#0A0A0F]">{user.username}</p>
                      <p className="text-xs text-[#9CA3AF]">{user.email}</p>
                    </div>
                  </Link>
                  <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                    <LogOut className="w-4 h-4 text-[#FF2D2D]" />
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="pt-3 mt-2 border-t border-black/[0.06] flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="flex-1 py-3 text-center text-sm font-medium text-[#6B7280] border border-black/[0.08] rounded-2xl hover:bg-black/[0.04] transition-colors">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}
                    className="flex-1 py-3 text-center text-sm font-semibold gradient-bg text-white rounded-2xl shadow-md shadow-red-200/40">
                    Get Started
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
