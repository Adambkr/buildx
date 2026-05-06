"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Flame, Briefcase, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const navItems = [
  { href: "/challenges", label: "Challenges", icon: Crosshair },
  { href: "/runs", label: "Runs", icon: Flame },
  { href: "/my-work", label: "My Work", icon: Briefcase },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, unreadCount } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-dark border-t border-white/[0.06] pb-safe"
      style={{ boxShadow: "0 -2px 20px rgba(0,0,0,0.3)" }}
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
                isActive ? "text-[#FF3366]" : "text-[#64748B]"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
                />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-gradient-hero text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-tight",
                isActive ? "text-[#FF3366]" : "text-[#64748B]"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-hero rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
