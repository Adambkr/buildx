"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setUser = useAppStore((s) => s.setUser);
  const setUnreadCount = useAppStore((s) => s.setUnreadCount);
  const addNotification = useAppStore((s) => s.addNotification);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser(profile);
          // Sync unread notification count into store
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", authUser.id)
            .eq("read", false)
            .then(({ count }) => {
              if (count !== null) setUnreadCount(count);
            });
        } else {
          // No row yet (e.g. Google OAuth on existing DB) — upsert it now
          const username =
            authUser.user_metadata?.preferred_username ||
            authUser.user_metadata?.user_name ||
            authUser.user_metadata?.full_name?.replace(/\s+/g, "").toLowerCase() ||
            authUser.email?.split("@")[0] ||
            "user";
          const avatar_url =
            authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture ||
            null;

          const { data: newProfile } = await supabase
            .from("users")
            .insert({
              id: authUser.id,
              email: authUser.email || "",
              username,
              avatar_url,
              bio: null,
              skills: [],
              role: "user",
              reputation_score: 0,
              created_at: authUser.created_at,
            })
            .select()
            .single();

          setUser(newProfile ?? {
            id: authUser.id,
            email: authUser.email || "",
            username,
            avatar_url,
            bio: null,
            skills: [],
            role: "user",
            reputation_score: 0,
            created_at: authUser.created_at,
          });
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      } else {
        getUser();
      }
    });

    // Realtime notifications subscription
    const notifChannel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notification = payload.new as import("@/lib/types").Notification;
          const currentUser = useAppStore.getState().user;
          if (currentUser && notification.user_id === currentUser.id) {
            addNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(notifChannel);
    };
  }, [setUser, setUnreadCount, addNotification]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#050507] min-h-screen pb-20 md:pb-0">{children}</main>
      <MobileBottomNav />
    </>
  );
}
