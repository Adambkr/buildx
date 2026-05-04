-- ============================================================
-- BuildX — Production Database Schema
-- ============================================================
-- Enforces ALL business logic at the database level.
-- Includes: tables, constraints, RLS, RPC functions, triggers,
--           indexes, and realtime publications.
-- ============================================================

-- ============================================================
-- 0. CLEAN SLATE — drop existing objects so schema can be re-run
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.apply_to_idea(uuid, text, uuid) cascade;
drop function if exists public.apply_to_idea(uuid, text) cascade;
drop function if exists public.accept_application(uuid) cascade;
drop function if exists public.reject_application(uuid) cascade;
drop function if exists public.toggle_idea_like(uuid) cascade;
drop function if exists public.increment_idea_views(uuid) cascade;
drop function if exists public.add_comment(uuid, text) cascade;
drop function if exists public.admin_get_stats() cascade;
drop function if exists public.admin_delete_user(uuid) cascade;
drop function if exists public.admin_delete_idea(uuid) cascade;
drop function if exists public.admin_get_ideas(int, int) cascade;
drop function if exists public.admin_get_projects(int, int) cascade;
drop function if exists public.admin_get_applications(int, int) cascade;
drop function if exists public.admin_promote_user(uuid) cascade;
drop function if exists public.admin_demote_user(uuid) cascade;
drop function if exists public.admin_close_idea(uuid) cascade;
drop function if exists public.admin_delete_project(uuid) cascade;
drop function if exists public.get_ranked_ideas(int) cascade;
drop function if exists public.trigger_notify_skill_matches() cascade;

drop table if exists public.notifications cascade;
drop table if exists public.activity_feed cascade;
drop table if exists public.milestones cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.tasks cascade;
drop table if exists public.project_members cascade;
drop table if exists public.projects cascade;
drop table if exists public.idea_applications cascade;
drop table if exists public.idea_roles cascade;
drop table if exists public.idea_likes cascade;
drop table if exists public.ideas cascade;
drop table if exists public.user_skill_levels cascade;
drop table if exists public.users cascade;

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1.1 USERS
create table public.users (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  email       text not null,
  avatar_url  text,
  bio         text,
  skills      jsonb not null default '[]'::jsonb,
  reputation_score integer not null default 0,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- 1.2 IDEAS
create table public.ideas (
  id                  uuid default uuid_generate_v4() primary key,
  title               text not null check (char_length(title) >= 3),
  description         text not null check (char_length(description) >= 10),
  creator_id          uuid not null references public.users(id) on delete cascade,
  category            text not null default 'Other',
  required_skills     jsonb not null default '[]'::jsonb,
  max_members         integer not null check (max_members >= 2 and max_members <= 10),
  current_members     integer not null default 1 check (current_members >= 1),
  status              text not null default 'open' check (status in ('open', 'full', 'closed')),
  likes_count         integer not null default 0,
  comments_count      integer not null default 0,
  applications_count  integer not null default 0,
  views_count         integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint members_within_limit check (current_members <= max_members)
);

-- 1.3 IDEA LIKES (junction table for proper like tracking)
create table public.idea_likes (
  id         uuid default uuid_generate_v4() primary key,
  idea_id    uuid not null references public.ideas(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(idea_id, user_id)
);

-- 1.4 IDEA ROLES (skill slots per idea) — must exist before idea_applications
create table public.idea_roles (
  id             uuid default uuid_generate_v4() primary key,
  idea_id        uuid not null references public.ideas(id) on delete cascade,
  role_name      text not null,
  required_count integer not null default 1 check (required_count >= 1 and required_count <= 5),
  current_count  integer not null default 0,
  priority       text not null default 'medium' check (priority in ('low', 'medium', 'critical')),
  created_at     timestamptz not null default now(),
  constraint role_not_overfilled check (current_count <= required_count)
);

-- 1.5 IDEA APPLICATIONS
create table public.idea_applications (
  id           uuid default uuid_generate_v4() primary key,
  idea_id      uuid not null references public.ideas(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role_id      uuid references public.idea_roles(id) on delete set null,
  role_name    text,
  message      text not null default '',
  match_score  integer not null default 0 check (match_score >= 0 and match_score <= 100),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  unique(idea_id, user_id)
);

-- 1.6 PROJECTS (unique idea_id enforces one project per idea)
create table public.projects (
  id         uuid default uuid_generate_v4() primary key,
  idea_id    uuid unique not null references public.ideas(id) on delete cascade,
  name       text not null,
  description text not null default '',
  status     text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.7 PROJECT MEMBERS
create table public.project_members (
  id         uuid default uuid_generate_v4() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  unique(project_id, user_id)
);

-- 1.8 MILESTONES (project phases) — must exist before tasks
create table public.milestones (
  id          uuid default uuid_generate_v4() primary key,
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'not_started' check (status in ('not_started', 'active', 'completed')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.9 TASKS
create table public.tasks (
  id           uuid default uuid_generate_v4() primary key,
  project_id   uuid not null references public.projects(id) on delete cascade,
  milestone_id uuid references public.milestones(id) on delete set null,
  title        text not null,
  description  text,
  completed    boolean not null default false,
  status       text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to  uuid references public.users(id) on delete set null,
  deadline     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1.10 POSTS (project feed)
create table public.posts (
  id         uuid default uuid_generate_v4() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- 1.11 COMMENTS
create table public.comments (
  id         uuid default uuid_generate_v4() primary key,
  post_id    uuid references public.posts(id) on delete cascade,
  idea_id    uuid references public.ideas(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  constraint comment_has_parent check (
    (post_id is not null and idea_id is null) or
    (post_id is null and idea_id is not null)
  )
);

-- 1.12 USER SKILL LEVELS (detailed skill proficiency)
create table public.user_skill_levels (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  level      text not null default 'intermediate' check (level in ('beginner', 'intermediate', 'expert')),
  created_at timestamptz not null default now(),
  unique(user_id, skill_name)
);

-- 1.13 ACTIVITY FEED
create table public.activity_feed (
  id         uuid default uuid_generate_v4() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  type       text not null check (type in (
    'task_completed','task_started','task_claimed','milestone_completed',
    'member_joined','member_left','project_started'
  )),
  message    text not null,
  created_at timestamptz not null default now()
);

-- 1.10 NOTIFICATIONS
create table public.notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in (
    'new_application','application_accepted','application_rejected',
    'project_created','task_assigned','comment','like'
  )),
  message      text not null,
  reference_id uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
create index idx_ideas_creator       on public.ideas(creator_id);
create index idx_ideas_status        on public.ideas(status);
create index idx_ideas_created       on public.ideas(created_at desc);
create index idx_ideas_ranking       on public.ideas(likes_count desc, views_count desc, created_at desc);
create index idx_idea_likes_idea     on public.idea_likes(idea_id);
create index idx_idea_likes_user     on public.idea_likes(user_id);
create index idx_applications_idea   on public.idea_applications(idea_id);
create index idx_applications_user   on public.idea_applications(user_id);
create index idx_applications_status on public.idea_applications(idea_id, status);
create index idx_project_members_p   on public.project_members(project_id);
create index idx_project_members_u   on public.project_members(user_id);
create index idx_tasks_project       on public.tasks(project_id);
create index idx_posts_project       on public.posts(project_id);
create index idx_comments_post       on public.comments(post_id);
create index idx_comments_idea       on public.comments(idea_id);
create index idx_notif_user          on public.notifications(user_id);
create index idx_notif_unread        on public.notifications(user_id) where read = false;
create index idx_idea_roles_idea     on public.idea_roles(idea_id);
create index idx_user_skills_user    on public.user_skill_levels(user_id);
create index idx_milestones_project  on public.milestones(project_id);
create index idx_tasks_milestone     on public.tasks(milestone_id);
create index idx_tasks_assigned      on public.tasks(assigned_to);
create index idx_activity_project    on public.activity_feed(project_id);
create index idx_activity_created    on public.activity_feed(created_at desc);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table public.users             enable row level security;
alter table public.ideas             enable row level security;
alter table public.idea_likes        enable row level security;
alter table public.idea_applications enable row level security;
alter table public.idea_roles        enable row level security;
alter table public.user_skill_levels enable row level security;
alter table public.projects          enable row level security;
alter table public.project_members   enable row level security;
alter table public.tasks             enable row level security;
alter table public.milestones        enable row level security;
alter table public.activity_feed     enable row level security;
alter table public.posts             enable row level security;
alter table public.comments          enable row level security;
alter table public.notifications     enable row level security;

-- Helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable
as $$ select exists(select 1 from public.users where id = auth.uid() and role = 'admin'); $$;

-- Helper: is caller a member of a given project?
create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql security definer stable
as $$ select exists(select 1 from public.project_members where project_id = p_project_id and user_id = auth.uid()); $$;

-- 3.1 USERS policies
create policy "users_select"  on public.users for select using (true);
create policy "users_update"  on public.users for update using (auth.uid() = id);
create policy "users_insert"  on public.users for insert with check (auth.uid() = id);
create policy "admin_users_delete" on public.users for delete using (public.is_admin());

-- 3.2 IDEAS policies
create policy "ideas_select"  on public.ideas for select using (true);
create policy "ideas_insert"  on public.ideas for insert with check (auth.uid() = creator_id);
create policy "ideas_update"  on public.ideas for update using (auth.uid() = creator_id or public.is_admin());
create policy "ideas_delete"  on public.ideas for delete using (auth.uid() = creator_id or public.is_admin());

-- 3.3 IDEA LIKES policies
create policy "likes_select"  on public.idea_likes for select using (true);
create policy "likes_insert"  on public.idea_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete"  on public.idea_likes for delete using (auth.uid() = user_id);

-- 3.4 IDEA APPLICATIONS policies
create policy "applications_select" on public.idea_applications for select using (
  auth.uid() = user_id
  or auth.uid() in (select creator_id from public.ideas where id = idea_id)
  or public.is_admin()
);
create policy "applications_insert" on public.idea_applications for insert
  with check (auth.uid() = user_id);
create policy "applications_update" on public.idea_applications for update using (
  auth.uid() in (select creator_id from public.ideas where id = idea_id)
);

-- 3.5 PROJECTS policies
create policy "projects_select" on public.projects for select using (
  public.is_project_member(id)
  or public.is_admin()
  or auth.uid() in (select creator_id from public.ideas where id = idea_id)
);
create policy "projects_update" on public.projects for update using (
  public.is_project_member(id) or public.is_admin()
);

-- 3.6 PROJECT MEMBERS policies
create policy "pm_select" on public.project_members for select using (
  public.is_project_member(project_id) or public.is_admin()
);
create policy "pm_insert" on public.project_members for insert with check (
  public.is_project_member(project_id) or public.is_admin()
);

-- 3.7 TASKS policies
create policy "tasks_all" on public.tasks for all using (
  public.is_project_member(project_id) or public.is_admin()
);

-- 3.8 POSTS policies
create policy "posts_all" on public.posts for all using (
  public.is_project_member(project_id) or public.is_admin()
);

-- 3.9 COMMENTS policies
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id or public.is_admin());

-- 3.10 NOTIFICATIONS policies
create policy "notif_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update" on public.notifications for update using (auth.uid() = user_id);

-- 3.11 IDEA ROLES policies
create policy "idea_roles_select" on public.idea_roles for select using (true);
create policy "idea_roles_insert" on public.idea_roles for insert with check (
  auth.uid() in (select creator_id from public.ideas where id = idea_id)
);
create policy "idea_roles_update" on public.idea_roles for update using (
  auth.uid() in (select creator_id from public.ideas where id = idea_id)
);
create policy "idea_roles_delete" on public.idea_roles for delete using (
  auth.uid() in (select creator_id from public.ideas where id = idea_id)
);

-- 3.12 USER SKILL LEVELS policies
create policy "skills_select" on public.user_skill_levels for select using (true);
create policy "skills_insert" on public.user_skill_levels for insert with check (auth.uid() = user_id);
create policy "skills_update" on public.user_skill_levels for update using (auth.uid() = user_id);
create policy "skills_delete" on public.user_skill_levels for delete using (auth.uid() = user_id);

-- 3.13 MILESTONES policies
create policy "milestones_select" on public.milestones for select using (
  public.is_project_member(project_id) or public.is_admin()
);
create policy "milestones_insert" on public.milestones for insert with check (
  public.is_project_member(project_id)
);
create policy "milestones_update" on public.milestones for update using (
  public.is_project_member(project_id)
);

-- 3.14 ACTIVITY FEED policies
create policy "activity_select" on public.activity_feed for select using (
  public.is_project_member(project_id) or public.is_admin()
);

-- ============================================================
-- 4. RPC FUNCTIONS (Business Logic — all transactional)
-- ============================================================

-- 4.1 Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_username text;
begin
  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  -- Ensure uniqueness by appending random suffix if needed
  if exists(select 1 from public.users where username = v_username) then
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.users (id, email, username, avatar_url, role)
  values (
    new.id,
    new.email,
    v_username,
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'adambalkar30@gmail.com' then 'admin' else 'user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4.2 APPLY TO IDEA — validates role slot, calculates match score
create or replace function public.apply_to_idea(
  p_idea_id  uuid,
  p_message  text default '',
  p_role_id  uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_idea       record;
  v_role       record;
  v_role_name  text;
  v_match      integer := 0;
  v_user_skills text[];
  v_matched    integer := 0;
  v_total      integer := 0;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_idea from ideas where id = p_idea_id for update;
  if v_idea is null then raise exception 'Idea not found'; end if;
  if v_idea.status != 'open' then
    raise exception 'This idea is not accepting applications (status: %)', v_idea.status;
  end if;
  if v_idea.creator_id = v_caller then
    raise exception 'You cannot apply to your own idea';
  end if;
  if exists(select 1 from idea_applications where idea_id = p_idea_id and user_id = v_caller) then
    raise exception 'You have already applied to this idea';
  end if;

  -- Validate role slot if provided
  if p_role_id is not null then
    select * into v_role from idea_roles where id = p_role_id and idea_id = p_idea_id for update;
    if v_role is null then raise exception 'Role not found for this idea'; end if;
    if v_role.current_count >= v_role.required_count then
      raise exception 'This role slot is already full: %', v_role.role_name;
    end if;
    v_role_name := v_role.role_name;
  end if;

  -- Calculate match score: user skills vs required idea skills
  select array_agg(lower(skill_name)) into v_user_skills
  from user_skill_levels where user_id = v_caller;

  if v_user_skills is null then v_user_skills := '{}'; end if;

  -- Count required_skills from idea that user matches
  select count(*) into v_total
  from jsonb_array_elements_text(v_idea.required_skills) s;

  select count(*) into v_matched
  from jsonb_array_elements_text(v_idea.required_skills) s
  where lower(s.value) = any(v_user_skills);

  if v_total > 0 then
    v_match := round((v_matched::numeric / v_total::numeric) * 100);
  else
    -- Fallback: boost by reputation (max 50 pts from reputation)
    select least(50, reputation_score / 2) into v_match from users where id = v_caller;
    v_match := coalesce(v_match, 0);
  end if;

  -- Clamp to [0, 100]
  v_match := greatest(0, least(100, v_match));

  insert into idea_applications (idea_id, user_id, role_id, role_name, message, match_score, status)
  values (p_idea_id, v_caller, p_role_id, v_role_name, p_message, v_match, 'pending');

  update ideas set applications_count = applications_count + 1, updated_at = now()
  where id = p_idea_id;

  insert into notifications (user_id, type, message, reference_id)
  values (v_idea.creator_id, 'new_application',
    'New application for "' || v_idea.title || '" — ' || v_match || '% match', p_idea_id);

  return jsonb_build_object('success', true, 'match_score', v_match);
end;
$$;

-- 4.3 ACCEPT APPLICATION — full transactional flow
create or replace function public.accept_application(p_application_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_app        record;
  v_idea       record;
  v_project_id uuid;
begin
  if v_caller is null then
    raise exception 'Authentication required';
  end if;

  -- Lock application row
  select * into v_app from idea_applications where id = p_application_id for update;
  if v_app is null then raise exception 'Application not found'; end if;
  if v_app.status != 'pending' then raise exception 'Application is not pending (status: %)', v_app.status; end if;

  -- Lock idea row
  select * into v_idea from ideas where id = v_app.idea_id for update;
  if v_idea is null then raise exception 'Idea not found'; end if;
  if v_idea.creator_id != v_caller then raise exception 'Only the idea creator can accept applications'; end if;
  if v_idea.status != 'open' then raise exception 'Idea is no longer accepting applications (status: %)', v_idea.status; end if;
  if v_idea.current_members >= v_idea.max_members then raise exception 'Team is already full'; end if;

  -- Accept the application
  update idea_applications set status = 'accepted' where id = p_application_id;

  -- Atomically increment member count
  update ideas
  set current_members = current_members + 1, updated_at = now()
  where id = v_idea.id;

  -- Increment role slot count if a role was specified
  if v_app.role_id is not null then
    update idea_roles set current_count = current_count + 1 where id = v_app.role_id;
  end if;

  -- Notify applicant
  insert into notifications (user_id, type, message, reference_id)
  values (v_app.user_id, 'application_accepted',
    'Your application to "' || v_idea.title || '" was accepted!', v_idea.id);

  -- Check if team is now full (v_idea.current_members holds the pre-increment snapshot)
  if v_idea.current_members + 1 >= v_idea.max_members then
    -- Lock idea as full
    update ideas set status = 'full' where id = v_idea.id;

    -- Create the project (unique constraint on idea_id prevents duplicates)
    insert into projects (idea_id, name, description)
    values (v_idea.id, v_idea.title, v_idea.description)
    returning id into v_project_id;

    -- Insert creator as owner
    insert into project_members (project_id, user_id, role)
    values (v_project_id, v_idea.creator_id, 'owner');

    -- Insert all accepted applicants as members
    insert into project_members (project_id, user_id, role)
    select v_project_id, ia.user_id, 'member'
    from idea_applications ia
    where ia.idea_id = v_idea.id and ia.status = 'accepted';

    -- Notify every project member
    insert into notifications (user_id, type, message, reference_id)
    select pm.user_id, 'project_created',
      'Project "' || v_idea.title || '" is live! Your team is ready.', v_project_id
    from project_members pm
    where pm.project_id = v_project_id;

    -- Reject remaining pending applications
    update idea_applications
    set status = 'rejected'
    where idea_id = v_idea.id and status = 'pending';

    -- Notify rejected applicants
    insert into notifications (user_id, type, message, reference_id)
    select ia.user_id, 'application_rejected',
      'The idea "' || v_idea.title || '" is now full. Your application was not accepted.', v_idea.id
    from idea_applications ia
    where ia.idea_id = v_idea.id and ia.status = 'rejected'
      and ia.id != p_application_id;

    return jsonb_build_object('success', true, 'project_created', true, 'project_id', v_project_id);
  end if;

  return jsonb_build_object('success', true, 'project_created', false);
end;
$$;

-- 4.4 REJECT APPLICATION
create or replace function public.reject_application(p_application_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_app    record;
  v_idea   record;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_app from idea_applications where id = p_application_id;
  if v_app is null then raise exception 'Application not found'; end if;
  if v_app.status != 'pending' then raise exception 'Application is not pending'; end if;

  select * into v_idea from ideas where id = v_app.idea_id;
  if v_idea.creator_id != v_caller then raise exception 'Only the idea creator can reject applications'; end if;

  update idea_applications set status = 'rejected' where id = p_application_id;

  insert into notifications (user_id, type, message, reference_id)
  values (v_app.user_id, 'application_rejected',
    'Your application to "' || v_idea.title || '" was not accepted.', v_idea.id);

  return jsonb_build_object('success', true);
end;
$$;

-- 4.5 TOGGLE IDEA LIKE (idempotent — like or unlike)
create or replace function public.toggle_idea_like(p_idea_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_exists boolean;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from ideas where id = p_idea_id) then raise exception 'Idea not found'; end if;

  select exists(select 1 from idea_likes where idea_id = p_idea_id and user_id = v_caller)
  into v_exists;

  if v_exists then
    delete from idea_likes where idea_id = p_idea_id and user_id = v_caller;
    update ideas set likes_count = greatest(likes_count - 1, 0) where id = p_idea_id;
    return jsonb_build_object('liked', false);
  else
    insert into idea_likes (idea_id, user_id) values (p_idea_id, v_caller);
    update ideas set likes_count = likes_count + 1 where id = p_idea_id;

    -- Notify idea creator (only on like, not unlike)
    insert into notifications (user_id, type, message, reference_id)
    select i.creator_id, 'like', 'Someone liked your idea "' || i.title || '"', p_idea_id
    from ideas i where i.id = p_idea_id and i.creator_id != v_caller;

    return jsonb_build_object('liked', true);
  end if;
end;
$$;

-- 4.6 INCREMENT VIEW COUNT
create or replace function public.increment_idea_view(p_idea_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update ideas set views_count = views_count + 1 where id = p_idea_id;
end;
$$;

-- Alias kept for backward-compat with any client calling the plural form
create or replace function public.increment_idea_views(p_idea_id uuid)
returns void language sql security definer set search_path = public
as $$ select public.increment_idea_view(p_idea_id); $$;

-- 4.7 ADD COMMENT (updates idea comment counter)
create or replace function public.add_comment(
  p_content text,
  p_idea_id uuid default null,
  p_post_id uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_id uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if p_idea_id is null and p_post_id is null then raise exception 'Must provide idea_id or post_id'; end if;
  if p_idea_id is not null and p_post_id is not null then raise exception 'Cannot set both idea_id and post_id'; end if;

  insert into comments (user_id, idea_id, post_id, content)
  values (v_caller, p_idea_id, p_post_id, p_content)
  returning id into v_id;

  if p_idea_id is not null then
    update ideas set comments_count = comments_count + 1, updated_at = now()
    where id = p_idea_id;

    insert into notifications (user_id, type, message, reference_id)
    select i.creator_id, 'comment', 'New comment on "' || i.title || '"', p_idea_id
    from ideas i where i.id = p_idea_id and i.creator_id != v_caller;
  end if;

  return v_id;
end;
$$;

-- 4.8 ADMIN: Platform stats
create or replace function public.admin_get_stats()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  select jsonb_build_object(
    'total_users',    (select count(*) from users),
    'total_ideas',    (select count(*) from ideas),
    'open_ideas',     (select count(*) from ideas where status = 'open'),
    'full_ideas',     (select count(*) from ideas where status = 'full'),
    'total_projects', (select count(*) from projects),
    'active_projects',(select count(*) from projects where status = 'active'),
    'total_applications', (select count(*) from idea_applications),
    'pending_applications', (select count(*) from idea_applications where status = 'pending')
  ) into v_result;

  return v_result;
end;
$$;

-- 4.9 ADMIN: Get all users
create or replace function public.admin_get_users(p_limit int default 100, p_offset int default 0)
returns setof public.users
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query select * from users order by created_at desc limit p_limit offset p_offset;
end;
$$;

-- 4.10 ADMIN: Delete user
create or replace function public.admin_delete_user(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_user_id = auth.uid() then raise exception 'Cannot delete yourself'; end if;

  delete from users where id = p_user_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 4.11 ADMIN: Delete idea
create or replace function public.admin_delete_idea(p_idea_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;

  delete from ideas where id = p_idea_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 4.12 ADMIN: Get all ideas (paginated)
create or replace function public.admin_get_ideas(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, title text, description text, category text,
  status text, likes_count int, applications_count int,
  current_members int, max_members int, views_count int,
  created_at timestamptz, creator_id uuid, creator_username text, creator_email text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select i.id, i.title, i.description, i.category,
           i.status, i.likes_count, i.applications_count,
           i.current_members, i.max_members, i.views_count,
           i.created_at, i.creator_id, u.username, u.email
    from ideas i
    join users u on u.id = i.creator_id
    order by i.created_at desc
    limit p_limit offset p_offset;
end;
$$;

-- 4.13 ADMIN: Get all projects (paginated)
create or replace function public.admin_get_projects(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, name text, description text, status text,
  created_at timestamptz, member_count bigint, task_count bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select p.id, p.name, p.description, p.status, p.created_at,
           (select count(*) from project_members pm where pm.project_id = p.id),
           (select count(*) from tasks t where t.project_id = p.id)
    from projects p
    order by p.created_at desc
    limit p_limit offset p_offset;
end;
$$;

-- 4.14 ADMIN: Get all applications (paginated)
create or replace function public.admin_get_applications(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, idea_id uuid, idea_title text, user_id uuid,
  username text, user_email text, role_name text,
  match_score int, status text, created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select a.id, a.idea_id, i.title, a.user_id,
           u.username, u.email, a.role_name,
           a.match_score, a.status, a.created_at
    from idea_applications a
    join ideas i on i.id = a.idea_id
    join users u on u.id = a.user_id
    order by a.created_at desc
    limit p_limit offset p_offset;
end;
$$;

-- 4.15 ADMIN: Promote user to admin
create or replace function public.admin_promote_user(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update users set role = 'admin' where id = p_user_id;
  return jsonb_build_object('success', true);
end;
$$;

-- 4.16 ADMIN: Demote admin to user
create or replace function public.admin_demote_user(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_user_id = auth.uid() then raise exception 'Cannot demote yourself'; end if;
  update users set role = 'user' where id = p_user_id;
  return jsonb_build_object('success', true);
end;
$$;

-- 4.17 ADMIN: Force-close an idea
create or replace function public.admin_close_idea(p_idea_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update ideas set status = 'closed', updated_at = now() where id = p_idea_id;
  -- Reject all pending applications
  update idea_applications set status = 'rejected'
  where idea_id = p_idea_id and status = 'pending';
  return jsonb_build_object('success', true);
end;
$$;

-- 4.18 ADMIN: Delete project
create or replace function public.admin_delete_project(p_project_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from projects where id = p_project_id;
  return jsonb_build_object('success', true);
end;
$$;

-- 4.19 CLAIM TASK — self-claim an unassigned task (enforces max active task limit)
create or replace function public.claim_task(p_task_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_task   record;
  v_active_count integer;
  v_max_active   constant integer := 3;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_task from tasks where id = p_task_id for update;
  if v_task is null then raise exception 'Task not found'; end if;
  if v_task.assigned_to is not null then raise exception 'Task is already assigned'; end if;
  if v_task.status = 'done' then raise exception 'Task is already done'; end if;
  if not public.is_project_member(v_task.project_id) then raise exception 'You are not a member of this project'; end if;

  -- Enforce task limit
  select count(*) into v_active_count
  from tasks where assigned_to = v_caller and status in ('todo','in_progress') and project_id = v_task.project_id;

  if v_active_count >= v_max_active then
    raise exception 'You already have % active tasks in this project (max %)', v_active_count, v_max_active;
  end if;

  update tasks set assigned_to = v_caller, status = 'in_progress', updated_at = now()
  where id = p_task_id;

  insert into activity_feed (project_id, user_id, type, message)
  select v_task.project_id, v_caller, 'task_claimed',
    (select username from users where id = v_caller) || ' claimed task "' || v_task.title || '"';

  insert into notifications (user_id, type, message, reference_id)
  select pm.user_id, 'task_assigned', 'Task "' || v_task.title || '" has been claimed', v_task.project_id
  from project_members pm
  where pm.project_id = v_task.project_id and pm.role = 'owner' and pm.user_id != v_caller;

  return jsonb_build_object('success', true);
end;
$$;

-- 4.13 UPDATE TASK STATUS
create or replace function public.update_task_status(p_task_id uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_task   record;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if p_status not in ('todo','in_progress','done') then raise exception 'Invalid status'; end if;

  select * into v_task from tasks where id = p_task_id;
  if v_task is null then raise exception 'Task not found'; end if;
  if not public.is_project_member(v_task.project_id) then raise exception 'Not a project member'; end if;
  if v_task.assigned_to is not null and v_task.assigned_to != v_caller then
    -- Allow owner to update any task
    if not exists(select 1 from project_members where project_id = v_task.project_id and user_id = v_caller and role = 'owner') then
      raise exception 'You can only update tasks assigned to you';
    end if;
  end if;

  update tasks
  set status = p_status, completed = (p_status = 'done'), updated_at = now()
  where id = p_task_id;

  if p_status = 'done' then
    insert into activity_feed (project_id, user_id, type, message)
    select v_task.project_id, v_caller, 'task_completed',
      (select username from users where id = v_caller) || ' completed "' || v_task.title || '"';
  elsif p_status = 'in_progress' then
    insert into activity_feed (project_id, user_id, type, message)
    select v_task.project_id, v_caller, 'task_started',
      (select username from users where id = v_caller) || ' started "' || v_task.title || '"';
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- 4.14 GET TEAM BALANCE SCORE for an idea
create or replace function public.get_team_balance_score(p_idea_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_total_slots    integer := 0;
  v_filled_slots   integer := 0;
  v_critical_gaps  integer := 0;
  v_balance_score  integer := 0;
  v_roles          jsonb;
begin
  select
    coalesce(sum(required_count), 0),
    coalesce(sum(current_count), 0),
    coalesce(sum(case when priority = 'critical' and current_count < required_count then 1 else 0 end), 0),
    coalesce(
      jsonb_agg(jsonb_build_object(
        'role_name', role_name,
        'required_count', required_count,
        'current_count', current_count,
        'priority', priority,
        'is_full', current_count >= required_count
      ) order by priority desc, role_name),
      '[]'::jsonb
    )
  into v_total_slots, v_filled_slots, v_critical_gaps, v_roles
  from idea_roles where idea_id = p_idea_id;

  if v_total_slots > 0 then
    v_balance_score := round((v_filled_slots::numeric / v_total_slots::numeric) * 100);
    -- Penalise for critical gaps
    v_balance_score := greatest(0, v_balance_score - (v_critical_gaps * 15));
  end if;

  return jsonb_build_object(
    'balance_score', v_balance_score,
    'label', case
      when v_balance_score >= 80 then 'Excellent'
      when v_balance_score >= 50 then 'Good'
      else 'Poor'
    end,
    'total_slots', v_total_slots,
    'filled_slots', v_filled_slots,
    'critical_gaps', v_critical_gaps,
    'roles', v_roles
  );
end;
$$;

-- 4.15 GET USER TASK SUMMARY (My Work dashboard)
create or replace function public.get_my_tasks()
returns table (
  id uuid, project_id uuid, milestone_id uuid,
  title text, description text, completed boolean,
  status text, priority text, assigned_to uuid,
  deadline timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql security definer stable set search_path = public
as $$
  select
    t.id, t.project_id, t.milestone_id,
    t.title, t.description, t.completed,
    t.status, t.priority, t.assigned_to,
    t.deadline, t.created_at, t.updated_at
  from tasks t
  join project_members pm on pm.project_id = t.project_id and pm.user_id = auth.uid()
  where t.assigned_to = auth.uid()
  order by
    case t.status when 'in_progress' then 0 when 'todo' then 1 else 2 end,
    case t.priority when 'high' then 0 when 'medium' then 1 else 2 end,
    t.deadline asc nulls last;
$$;

-- 4.16 GET RANKED IDEAS (boost balanced / near-full ideas)
create or replace function public.get_ranked_ideas(p_limit int default 20)
returns table (
  id uuid, title text, description text, category text,
  required_skills jsonb, max_members int, current_members int,
  status text, likes_count int, comments_count int,
  applications_count int, views_count int,
  created_at timestamptz, updated_at timestamptz,
  creator_id uuid, rank_score numeric
)
language sql security definer stable set search_path = public
as $$
  select
    i.id, i.title, i.description, i.category,
    i.required_skills, i.max_members, i.current_members,
    i.status, i.likes_count, i.comments_count,
    i.applications_count, i.views_count,
    i.created_at, i.updated_at, i.creator_id,
    (
      -- Fill ratio component (0-40 pts): ideas closer to full rank higher
      (i.current_members::numeric / nullif(i.max_members, 0)) * 40
      -- Likes component (0-30 pts)
      + least(i.likes_count, 300)::numeric / 300.0 * 30
      -- Freshness component (0-20 pts): decay over 7 days
      + greatest(0, 20 - (extract(epoch from now() - i.created_at) / 86400.0) * (20.0/7.0))
      -- Balance bonus (0-10 pts): ideas with filled critical roles get a boost
      + coalesce((
          select least(10, (sum(r.current_count)::numeric / nullif(sum(r.required_count),0)) * 10)
          from idea_roles r where r.idea_id = i.id
        ), 0)
    ) as rank_score
  from ideas i
  where i.status = 'open'
  order by rank_score desc
  limit p_limit;
$$;

-- 4.17 NOTIFY USERS WHEN ROLE IS NEEDED (auto-recommendation)
create or replace function public.notify_skill_matches(p_idea_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_idea    record;
  v_role    record;
  v_count   integer := 0;
begin
  select * into v_idea from ideas where id = p_idea_id;
  if v_idea is null then return 0; end if;

  for v_role in
    select * from idea_roles
    where idea_id = p_idea_id and current_count < required_count
  loop
    insert into notifications (user_id, type, message)
    select distinct usl.user_id, 'task_assigned',
      'Your skill "' || v_role.role_name || '" is needed in "' || v_idea.title || '" — apply now!'
    from user_skill_levels usl
    where lower(usl.skill_name) = lower(v_role.role_name)
      and usl.user_id != v_idea.creator_id
      and not exists(
        select 1 from idea_applications ia
        where ia.idea_id = p_idea_id and ia.user_id = usl.user_id
      )
    limit 20;

    get diagnostics v_count = row_count;
  end loop;

  return v_count;
end;
$$;

-- 4.18 TRIGGER: auto-notify skill matches when a new idea_role is inserted
create or replace function public.trigger_notify_skill_matches()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_skill_matches(new.idea_id);
  return new;
end;
$$;

create trigger on_idea_role_inserted
  after insert on public.idea_roles
  for each row execute function public.trigger_notify_skill_matches();

-- ============================================================
-- 5. REALTIME PUBLICATIONS
-- ============================================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.idea_applications;
alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.tasks;
