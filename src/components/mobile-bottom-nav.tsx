"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, FolderKanban, Briefcase, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const navItems = [
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/my-work", label: "My Work", icon: Briefcase },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, unreadCount } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-white/60 pb-safe"
      style={{ boxShadow: "0 -2px 20px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const profileHref = user ? `/profile/${user.id}` : "/login";
          const href = item.href === "/profile" ? profileHref : item.href;
          const isActive =
            item.href === "/profile"
              ? pathname.startsWith("/profile")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full relative transition-colors",
                isActive ? "text-[#FF2D2D]" : "text-[#9CA3AF]"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
                />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 gradient-bg text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-tight",
                isActive ? "text-[#FF2D2D]" : "text-[#9CA3AF]"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 gradient-bg rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
