/* ═══════════════════════════════════════════
   GAMIFIED CHALLENGE PLATFORM — DOMAIN TYPES
   Ideas → Challenges | Projects → Runs | Teams → Squads | Tasks → Missions
   ═══════════════════════════════════════════ */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  reputation_score: number;
  xp: number;
  level: number;
  role: "user" | "admin";
  created_at: string;
}

/* ── CHALLENGE (was Idea) ── */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "weekend" | "1_week" | "2_weeks" | "1_month";
  tags: string[];
  required_skills: string[];
  max_squad_size: number;
  current_members: number;
  status: "open" | "in_progress" | "full" | "closed";
  likes_count: number;
  comments_count: number;
  applications_count: number;
  views_count: number;
  xp_reward: number;
  badge_reward: string | null;
  created_at: string;
  updated_at: string;
  creator?: User;
  applications?: ChallengeApplication[];
  roles?: ChallengeRole[];
}

export interface ChallengeRole {
  id: string;
  challenge_id: string;
  role_name: string;
  required_count: number;
  current_count: number;
  priority: "low" | "medium" | "critical";
  created_at: string;
}

export interface ChallengeApplication {
  id: string;
  challenge_id: string;
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  message: string;
  match_score: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  user?: User;
  challenge_title?: string;
  run_id?: string | null;
}

export interface TeamBalanceScore {
  balance_score: number;
  label: "Poor" | "Good" | "Excellent";
  total_slots: number;
  filled_slots: number;
  critical_gaps: number;
  roles: {
    role_name: string;
    required_count: number;
    current_count: number;
    priority: "low" | "medium" | "critical";
    is_full: boolean;
  }[];
}

/* ── CHALLENGE RUN (was Project) ── */
export interface ChallengeRun {
  id: string;
  challenge_id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  completed_at: string | null;
  progress_pct: number;
  xp_earned: number;
  created_at: string;
  updated_at: string;
  members?: SquadMember[];
  missions?: Mission[];
  phases?: Phase[];
}

export interface SquadMember {
  id: string;
  run_id: string;
  user_id: string;
  squad_role: "leader" | "member";
  joined_at: string;
  user?: User;
}

/* ── PHASE (was Milestone) ── */
export interface Phase {
  id: string;
  run_id: string;
  title: string;
  description: string | null;
  status: "not_started" | "active" | "completed";
  sort_order: number;
  created_at: string;
  updated_at: string;
  missions?: Mission[];
}

/* ── MISSION (was Task) ── */
export interface Mission {
  id: string;
  run_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  status: "pending" | "active" | "completed";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  xp_value: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee?: User;
}

/* ── ACTIVITY FEED ── */
export interface ActivityFeedItem {
  id: string;
  run_id: string;
  user_id: string | null;
  type:
    | "mission_completed"
    | "mission_started"
    | "mission_claimed"
    | "mission_assigned"
    | "phase_completed"
    | "squad_joined"
    | "squad_left"
    | "run_started"
    | "run_completed";
  message: string;
  created_at: string;
  user?: User;
}

/* ── BOOKMARK ── */
export interface Bookmark {
  id: string;
  user_id: string;
  challenge_id: string;
  created_at: string;
}

/* ── POSTS / CHAT ── */
export interface Post {
  id: string;
  run_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string | null;
  challenge_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

/* ── BADGES ── */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  color: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

/* ── NOTIFICATIONS ── */
export interface Notification {
  id: string;
  user_id: string;
  type:
    | "new_application"
    | "application_accepted"
    | "application_rejected"
    | "run_started"
    | "mission_assigned"
    | "mission_completed"
    | "phase_completed"
    | "comment"
    | "like"
    | "badge_earned"
    | "level_up";
  message: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

/* ── USER SKILL ── */
export interface UserSkillLevel {
  id: string;
  user_id: string;
  skill_name: string;
  level: "beginner" | "intermediate" | "expert";
  created_at: string;
}

export type FeedType = "trending" | "new" | "for-you" | "almost-full";

/* ── LEGACY ALIASES (for backward compat during migration) ── */
export type Idea = Challenge;
export type Project = ChallengeRun;
export type Task = Mission;
export type Milestone = Phase;
export type ProjectMember = SquadMember;
export type IdeaApplication = ChallengeApplication;
export type IdeaRole = ChallengeRole;
