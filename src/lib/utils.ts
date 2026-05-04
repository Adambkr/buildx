import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateIdeaScore(idea: {
  likes_count: number;
  comments_count: number;
  views_count: number;
  current_members: number;
  max_members: number;
  created_at: string;
}) {
  const engagement =
    (idea.likes_count * 3 + idea.comments_count * 2 + idea.views_count * 0.1) /
    10;

  const hoursAgo =
    (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60);
  const recency = Math.max(0, 100 - hoursAgo * 2);

  const urgency =
    idea.max_members > 0
      ? (idea.current_members / idea.max_members) * 100
      : 0;

  const reputation = 50; // Default, would come from creator

  const score =
    engagement * 0.35 +
    recency * 0.2 +
    urgency * 0.2 +
    50 * 0.15 + // match_score placeholder
    reputation * 0.1;

  return Math.round(score * 100) / 100;
}

export function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getSlotColor(current: number, max: number): string {
  const ratio = current / max;
  if (ratio >= 0.9) return "text-red-600";
  if (ratio >= 0.7) return "text-orange-500";
  return "text-emerald-600";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
