export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  reputation_score: number;
  role: "user" | "admin";
  created_at: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  category: string;
  required_skills: string[];
  max_members: number;
  current_members: number;
  status: "open" | "full" | "closed";
  likes_count: number;
  comments_count: number;
  applications_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  creator?: User;
  applications?: IdeaApplication[];
  roles?: IdeaRole[];
}

export interface IdeaRole {
  id: string;
  idea_id: string;
  role_name: string;
  required_count: number;
  current_count: number;
  priority: "low" | "medium" | "critical";
  created_at: string;
}

export interface UserSkillLevel {
  id: string;
  user_id: string;
  skill_name: string;
  level: "beginner" | "intermediate" | "expert";
  created_at: string;
}

export interface IdeaApplication {
  id: string;
  idea_id: string;
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  message: string;
  match_score: number;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  user?: User;
  idea_title?: string;
  project_id?: string | null;
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

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "not_started" | "active" | "completed";
  sort_order: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface ActivityFeedItem {
  id: string;
  project_id: string;
  user_id: string | null;
  type: "task_completed" | "task_started" | "task_claimed" | "milestone_completed" | "member_joined" | "member_left" | "project_started";
  message: string;
  created_at: string;
  user?: User;
}

export interface Project {
  id: string;
  idea_id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "paused";
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  user?: User;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  assignee?: User;
}

export interface Post {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string | null;
  idea_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "new_application" | "application_accepted" | "application_rejected" | "project_created" | "task_assigned" | "comment" | "like";
  message: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
}

export type FeedType = "trending" | "new" | "for-you" | "almost-full";
