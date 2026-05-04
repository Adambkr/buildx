"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, FolderKanban, Bell, LogOut,
  Zap, Shield, Briefcase,
} from "lucide-react";
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

            {/* Right side — desktop */}
            <div className="hidden md:flex items-center gap-1.5">
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
            </div>

            {/* Mobile right side — compact */}
            <div className="flex md:hidden items-center gap-1">
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                      title="Admin Panel"
                    >
                      <Shield className="w-5 h-5 text-[#FF2D2D]" />
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5 text-[#9CA3AF]" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-2 text-sm font-medium text-[#6B7280]"
                  >
                    Sign in
                  </Link>
                  <Link href="/signup"
                    className="inline-flex px-4 py-2 text-sm font-semibold gradient-bg text-white rounded-2xl shadow-md shadow-red-200/40"
                  >
                    Start
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

    </>
  );
}
