"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  UserPlus,
  CheckCircle2,
  XCircle,
  Flame,
  MessageCircle,
  Heart,
  Swords,
  Star,
  Zap,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, timeAgo } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

function getNotificationHref(n: Notification): string {
  const ref = n.reference_id;
  switch (n.type) {
    case "new_application":
    case "application_accepted":
    case "application_rejected":
    case "comment":
    case "like":
      return ref ? `/ideas/${ref}` : "/ideas";
    case "run_started":
    case "mission_assigned":
      return ref ? `/projects/${ref}` : "/projects";
    default:
      return "/notifications";
  }
}

const demoNotifications: Notification[] = [
  {
    id: "n1",
    user_id: "demo-1",
    type: "new_application",
    message: "James Liu applied to join your idea 'AI Study Companion'",
    reference_id: null,
    read: false,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "n2",
    user_id: "demo-1",
    type: "application_accepted",
    message: "You were accepted to 'Eco Marketplace'",
    reference_id: null,
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n3",
    user_id: "demo-1",
    type: "comment",
    message: "Priya Patel commented on 'AI Study Companion'",
    reference_id: null,
    read: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n4",
    user_id: "demo-1",
    type: "like",
    message: "Mike Rodriguez liked your idea 'AI Study Companion'",
    reference_id: null,
    read: true,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n5",
    user_id: "demo-1",
    type: "mission_assigned",
    message: "You were assigned 'Build AI quiz generator' in AI Study Companion",
    reference_id: null,
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n6",
    user_id: "demo-1",
    type: "badge_earned",
    message: "You earned the 'AI Architect' badge!",
    reference_id: null,
    read: false,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n7",
    user_id: "demo-1",
    type: "level_up",
    message: "You leveled up to Level 6!",
    reference_id: null,
    read: true,
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
];

const typeIcons: Record<Notification["type"], React.ElementType> = {
  new_application: UserPlus,
  application_accepted: CheckCircle2,
  application_rejected: XCircle,
  run_started: Flame,
  mission_assigned: Swords,
  mission_completed: Trophy,
  phase_completed: Star,
  comment: MessageCircle,
  like: Heart,
  badge_earned: Star,
  level_up: Zap,
};

const typeColors: Record<Notification["type"], string> = {
  new_application: "bg-[#00E5FF]/10 text-[#00E5FF]",
  application_accepted: "bg-[#00FFA3]/10 text-[#00FFA3]",
  application_rejected: "bg-[#FF3366]/10 text-[#FF3366]",
  run_started: "bg-[#A855F7]/10 text-[#A855F7]",
  mission_assigned: "bg-[#FFD700]/10 text-[#FFD700]",
  mission_completed: "bg-[#00FFA3]/10 text-[#00FFA3]",
  phase_completed: "bg-[#00E5FF]/10 text-[#00E5FF]",
  comment: "bg-[#FF3366]/10 text-[#FF3366]",
  like: "bg-[#FF6B9D]/10 text-[#FF6B9D]",
  badge_earned: "bg-[#FFD700]/10 text-[#FFD700]",
  level_up: "bg-[#00E5FF]/10 text-[#00E5FF]",
};

export default function NotificationsPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);
  const setStoreNotifications = useAppStore((s) => s.setNotifications);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user === null && !loaded) return;
    if (user === null) { setNotifications(demoNotifications); setLoaded(true); return; }
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        const fetched = data ?? [];
        setNotifications(fetched);
        setStoreNotifications(fetched);
      } catch { setNotifications(demoNotifications); setStoreNotifications(demoNotifications); }
      finally { setLoaded(true); }
    };
    load();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markRead(id);
    if (loaded) {
      try {
        const supabase = createClient();
        await supabase.from("notifications").update({ read: true }).eq("id", id);
      } catch { /* silent */ }
    }
  };

  const markAllRead = async () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    if (loaded && user) {
      try {
        const supabase = createClient();
        await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      } catch { /* silent */ }
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) await handleMarkRead(n.id);
    const href = getNotificationHref(n);
    if (href !== "/notifications") router.push(href);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Notifications</h1>
            <p className="text-[#64748B] mt-1 text-sm">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up! ✓"}
            </p>
          </div>
          {unreadCount > 0 && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={markAllRead}
              className="text-sm font-bold text-[#FF3366] hover:underline cursor-pointer"
            >
              Mark all read
            </motion.button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((notification, i) => {
            const Icon = typeIcons[notification.type];
            const colorClass = typeColors[notification.type];
            return (
              <motion.div key={notification.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button type="button" onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 group",
                    notification.read
                      ? "glass-dark border-white/[0.06] hover:border-white/10"
                      : "bg-[#FF3366]/5 border-[#FF3366]/10 shadow-sm"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", colorClass)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      notification.read ? "text-[#64748B]" : "text-white font-semibold"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1" suppressHydrationWarning>
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-[#FF3366] rounded-full flex-shrink-0 mt-2 animate-pulse" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
              <Bell className="w-8 h-8 text-[#64748B]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No notifications</h3>
            <p className="text-[#64748B] text-sm">You&apos;ll see updates here when something happens.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
