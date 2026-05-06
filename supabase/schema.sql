-- ============================================================
-- BuildX — Gamified Challenge Platform Schema
-- ============================================================
-- Domain: Challenges, Challenge Runs, Squads, Missions, Phases, Badges
-- ============================================================

-- 0. CLEAN SLATE
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Drop old RPCs
drop function if exists public.apply_to_idea(uuid, text, uuid) cascade;
drop function if exists public.apply_to_idea(uuid, text) cascade;
drop function if exists public.accept_application(uuid) cascade;
drop function if exists public.reject_application(uuid) cascade;
drop function if exists public.toggle_idea_like(uuid) cascade;
drop function if exists public.increment_idea_views(uuid) cascade;
drop function if exists public.increment_idea_view(uuid) cascade;
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
drop function if exists public.toggle_bookmark(uuid) cascade;
drop function if exists public.start_project_early(uuid) cascade;
drop function if exists public.complete_project(uuid) cascade;
drop function if exists public.claim_task(uuid) cascade;
drop function if exists public.update_task_status(uuid, text) cascade;
drop function if exists public.get_team_balance_score(uuid) cascade;
drop function if exists public.get_my_tasks() cascade;
drop function if exists public.notify_skill_matches(uuid) cascade;

-- Drop old tables
drop table if exists public.user_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.notifications cascade;
drop table if exists public.activity_feed cascade;
drop table if exists public.milestones cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.tasks cascade;
drop table if exists public.project_members cascade;
drop table if exists public.bookmarks cascade;
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

-- 1.1 USERS (gamified: xp, level)
create table public.users (
  id          uuid references auth.users on delete cascade primary key,
  username    text unique not null,
  email       text not null,
  avatar_url  text,
  bio         text,
  skills      jsonb not null default '[]'::jsonb,
  reputation_score integer not null default 0,
  xp          integer not null default 0,
  level       integer not null default 1 check (level >= 1),
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- 1.2 CHALLENGES (formerly ideas)
create table public.challenges (
  id                  uuid default uuid_generate_v4() primary key,
  title               text not null check (char_length(title) >= 3),
  description         text not null check (char_length(description) >= 10),
  creator_id          uuid not null references public.users(id) on delete cascade,
  category            text not null default 'Other',
  difficulty          text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  tags                jsonb not null default '[]'::jsonb,
  required_skills     jsonb not null default '[]'::jsonb,
  duration            text not null default 'flexible' check (duration in ('1_week', '2_weeks', '1_month', 'flexible')),
  xp_reward           integer not null default 0 check (xp_reward >= 0),
  badge_reward        text,
  max_squad_size      integer not null check (max_squad_size >= 2 and max_squad_size <= 10),
  current_members     integer not null default 1 check (current_members >= 1),
  status              text not null default 'open' check (status in ('open', 'in_progress', 'full', 'closed')),
  likes_count         integer not null default 0,
  comments_count      integer not null default 0,
  applications_count  integer not null default 0,
  views_count         integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint members_within_limit check (current_members <= max_squad_size)
);

-- 1.3 CHALLENGE LIKES
create table public.challenge_likes (
  id         uuid default uuid_generate_v4() primary key,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- 1.4 CHALLENGE ROLES (skill slots per challenge)
create table public.challenge_roles (
  id             uuid default uuid_generate_v4() primary key,
  challenge_id   uuid not null references public.challenges(id) on delete cascade,
  role_name      text not null,
  required_count integer not null default 1 check (required_count >= 1 and required_count <= 5),
  current_count  integer not null default 0,
  priority       text not null default 'medium' check (priority in ('low', 'medium', 'critical')),
  created_at     timestamptz not null default now(),
  constraint role_not_overfilled check (current_count <= required_count)
);

-- 1.5 CHALLENGE APPLICATIONS
create table public.challenge_applications (
  id           uuid default uuid_generate_v4() primary key,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role_id      uuid references public.challenge_roles(id) on delete set null,
  role_name    text,
  message      text not null default '',
  match_score  integer not null default 0 check (match_score >= 0 and match_score <= 100),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- 1.6 CHALLENGE RUNS (formerly projects — one run per challenge)
create table public.challenge_runs (
  id           uuid default uuid_generate_v4() primary key,
  challenge_id uuid unique not null references public.challenges(id) on delete cascade,
  name         text not null,
  description  text not null default '',
  status       text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  progress_pct integer not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  xp_earned    integer not null default 0 check (xp_earned >= 0),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1.6b BOOKMARKS
create table public.bookmarks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, challenge_id)
);

-- 1.7 RUN MEMBERS (squad members)
create table public.run_members (
  id         uuid default uuid_generate_v4() primary key,
  run_id     uuid not null references public.challenge_runs(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  squad_role text not null default 'member' check (squad_role in ('leader', 'member')),
  joined_at  timestamptz not null default now(),
  unique(run_id, user_id)
);

-- 1.8 PHASES (run phases — formerly milestones)
create table public.phases (
  id          uuid default uuid_generate_v4() primary key,
  run_id      uuid not null references public.challenge_runs(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'not_started' check (status in ('not_started', 'active', 'completed')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.9 MISSIONS (formerly tasks)
create table public.missions (
  id           uuid default uuid_generate_v4() primary key,
  run_id       uuid not null references public.challenge_runs(id) on delete cascade,
  phase_id     uuid references public.phases(id) on delete set null,
  title        text not null,
  description  text,
  status       text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  xp_value     integer not null default 0 check (xp_value >= 0),
  assigned_to  uuid references public.users(id) on delete set null,
  deadline     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1.10 POSTS (run chat)
create table public.posts (
  id         uuid default uuid_generate_v4() primary key,
  run_id     uuid not null references public.challenge_runs(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- 1.11 COMMENTS (on challenges)
create table public.comments (
  id          uuid default uuid_generate_v4() primary key,
  post_id     uuid references public.posts(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now(),
  constraint comment_has_parent check (
    (post_id is not null and challenge_id is null) or
    (post_id is null and challenge_id is not null)
  )
);

-- 1.12 USER SKILL LEVELS
create table public.user_skill_levels (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  level      text not null default 'intermediate' check (level in ('beginner', 'intermediate', 'expert')),
  created_at timestamptz not null default now(),
  unique(user_id, skill_name)
);

-- 1.13 BADGES
create table public.badges (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null unique,
  description text not null,
  icon_url    text,
  rarity      text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  xp_bonus    integer not null default 0 check (xp_bonus >= 0),
  created_at  timestamptz not null default now()
);

-- 1.14 USER BADGES
create table public.user_badges (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  badge_id   uuid not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- 1.15 ACTIVITY FEED (run activity)
create table public.activity_feed (
  id         uuid default uuid_generate_v4() primary key,
  run_id     uuid not null references public.challenge_runs(id) on delete cascade,
  user_id    uuid references public.users(id) on delete set null,
  type       text not null check (type in (
    'mission_completed','mission_started','mission_claimed','mission_assigned','mission_unassigned',
    'phase_completed','squad_joined','squad_left','run_started','run_completed'
  )),
  message    text not null,
  created_at timestamptz not null default now()
);

-- 1.16 NOTIFICATIONS
create table public.notifications (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid not null references public.users(id) on delete cascade,
  type         text not null check (type in (
    'new_application','application_accepted','application_rejected',
    'run_started','mission_assigned','mission_completed','phase_completed',
    'comment','like','badge_earned','level_up'
  )),
  message      text not null,
  reference_id uuid,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
create index idx_challenges_creator       on public.challenges(creator_id);
create index idx_challenges_status        on public.challenges(status);
create index idx_challenges_created       on public.challenges(created_at desc);
create index idx_challenges_ranking       on public.challenges(likes_count desc, views_count desc, created_at desc);
create index idx_challenge_likes_c        on public.challenge_likes(challenge_id);
create index idx_challenge_likes_u        on public.challenge_likes(user_id);
create index idx_applications_challenge   on public.challenge_applications(challenge_id);
create index idx_applications_user        on public.challenge_applications(user_id);
create index idx_applications_status      on public.challenge_applications(challenge_id, status);
create index idx_run_members_run          on public.run_members(run_id);
create index idx_run_members_user         on public.run_members(user_id);
create index idx_missions_run             on public.missions(run_id);
create index idx_posts_run                on public.posts(run_id);
create index idx_comments_post            on public.comments(post_id);
create index idx_comments_challenge       on public.comments(challenge_id);
create index idx_notif_user               on public.notifications(user_id);
create index idx_notif_unread             on public.notifications(user_id) where read = false;
create index idx_challenge_roles_c        on public.challenge_roles(challenge_id);
create index idx_user_skills_user         on public.user_skill_levels(user_id);
create index idx_phases_run               on public.phases(run_id);
create index idx_missions_phase           on public.missions(phase_id);
create index idx_missions_assigned        on public.missions(assigned_to);
create index idx_activity_run             on public.activity_feed(run_id);
create index idx_activity_created         on public.activity_feed(created_at desc);
create index idx_bookmarks_user           on public.bookmarks(user_id);
create index idx_bookmarks_challenge      on public.bookmarks(challenge_id);
create index idx_user_badges_user         on public.user_badges(user_id);
create index idx_user_badges_badge        on public.user_badges(badge_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
alter table public.users                   enable row level security;
alter table public.challenges              enable row level security;
alter table public.challenge_likes         enable row level security;
alter table public.challenge_applications  enable row level security;
alter table public.challenge_roles         enable row level security;
alter table public.user_skill_levels       enable row level security;
alter table public.challenge_runs          enable row level security;
alter table public.run_members             enable row level security;
alter table public.missions                enable row level security;
alter table public.phases                  enable row level security;
alter table public.activity_feed           enable row level security;
alter table public.posts                   enable row level security;
alter table public.comments                enable row level security;
alter table public.bookmarks               enable row level security;
alter table public.notifications           enable row level security;
alter table public.badges                  enable row level security;
alter table public.user_badges             enable row level security;

-- Helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable
as $$ select exists(select 1 from public.users where id = auth.uid() and role = 'admin'); $$;

-- Helper: is caller a member of a given run?
create or replace function public.is_run_member(p_run_id uuid)
returns boolean language sql security definer stable
as $$ select exists(select 1 from public.run_members where run_id = p_run_id and user_id = auth.uid()); $$;

-- 3.1 USERS
create policy "users_select"  on public.users for select using (true);
create policy "users_update"  on public.users for update using (auth.uid() = id);
create policy "users_insert"  on public.users for insert with check (auth.uid() = id);
create policy "admin_users_delete" on public.users for delete using (public.is_admin());

-- 3.2 CHALLENGES
create policy "challenges_select"  on public.challenges for select using (true);
create policy "challenges_insert"  on public.challenges for insert with check (auth.uid() = creator_id);
create policy "challenges_update"  on public.challenges for update using (auth.uid() = creator_id or public.is_admin());
create policy "challenges_delete"  on public.challenges for delete using (auth.uid() = creator_id or public.is_admin());

-- 3.3 CHALLENGE LIKES
create policy "likes_select"  on public.challenge_likes for select using (true);
create policy "likes_insert"  on public.challenge_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete"  on public.challenge_likes for delete using (auth.uid() = user_id);

-- 3.4 CHALLENGE APPLICATIONS
create policy "applications_select" on public.challenge_applications for select using (
  auth.uid() = user_id
  or auth.uid() in (select creator_id from public.challenges where id = challenge_id)
  or public.is_admin()
);
create policy "applications_insert" on public.challenge_applications for insert
  with check (auth.uid() = user_id);
create policy "applications_update" on public.challenge_applications for update using (
  auth.uid() in (select creator_id from public.challenges where id = challenge_id)
);

-- 3.5 CHALLENGE RUNS
create policy "runs_select" on public.challenge_runs for select using (
  public.is_run_member(id)
  or public.is_admin()
  or auth.uid() in (select creator_id from public.challenges where id = challenge_id)
);
create policy "runs_update" on public.challenge_runs for update using (
  public.is_run_member(id) or public.is_admin()
);

-- 3.6 RUN MEMBERS
create policy "rm_select" on public.run_members for select using (
  public.is_run_member(run_id) or public.is_admin()
);
create policy "rm_insert" on public.run_members for insert with check (
  public.is_run_member(run_id) or public.is_admin()
);

-- 3.7 MISSIONS
create policy "missions_all" on public.missions for all using (
  public.is_run_member(run_id) or public.is_admin()
);

-- 3.8 POSTS
create policy "posts_all" on public.posts for all using (
  public.is_run_member(run_id) or public.is_admin()
);

-- 3.9 COMMENTS
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id or public.is_admin());

-- 3.10 NOTIFICATIONS
create policy "notif_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update" on public.notifications for update using (auth.uid() = user_id);

-- 3.11 CHALLENGE ROLES
create policy "challenge_roles_select" on public.challenge_roles for select using (true);
create policy "challenge_roles_insert" on public.challenge_roles for insert with check (
  auth.uid() in (select creator_id from public.challenges where id = challenge_id)
);
create policy "challenge_roles_update" on public.challenge_roles for update using (
  auth.uid() in (select creator_id from public.challenges where id = challenge_id)
);
create policy "challenge_roles_delete" on public.challenge_roles for delete using (
  auth.uid() in (select creator_id from public.challenges where id = challenge_id)
);

-- 3.12 USER SKILL LEVELS
create policy "skills_select" on public.user_skill_levels for select using (true);
create policy "skills_insert" on public.user_skill_levels for insert with check (auth.uid() = user_id);
create policy "skills_update" on public.user_skill_levels for update using (auth.uid() = user_id);
create policy "skills_delete" on public.user_skill_levels for delete using (auth.uid() = user_id);

-- 3.13 PHASES
create policy "phases_select" on public.phases for select using (
  public.is_run_member(run_id) or public.is_admin()
);
create policy "phases_insert" on public.phases for insert with check (
  public.is_run_member(run_id)
);
create policy "phases_update" on public.phases for update using (
  public.is_run_member(run_id)
);

-- 3.14 ACTIVITY FEED
create policy "activity_select" on public.activity_feed for select using (
  public.is_run_member(run_id) or public.is_admin()
);

-- 3.15 BOOKMARKS
create policy "bookmarks_select" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete" on public.bookmarks for delete using (auth.uid() = user_id);

-- 3.16 BADGES
create policy "badges_select" on public.badges for select using (true);
create policy "badges_admin" on public.badges for all using (public.is_admin());

-- 3.17 USER BADGES
create policy "user_badges_select" on public.user_badges for select using (true);
create policy "user_badges_insert" on public.user_badges for insert with check (public.is_admin());

-- ============================================================
-- 4. RPC FUNCTIONS (Business Logic)
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
  if exists(select 1 from public.users where username = v_username) then
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.users (id, email, username, avatar_url, role, xp, level)
  values (
    new.id,
    new.email,
    v_username,
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'adambalkar30@gmail.com' then 'admin' else 'user' end,
    0, 1
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4.2 APPLY TO CHALLENGE
create or replace function public.apply_to_challenge(
  p_challenge_id  uuid,
  p_message  text default '',
  p_role_id  uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_challenge  record;
  v_role       record;
  v_role_name  text;
  v_match      integer := 0;
  v_user_skills text[];
  v_matched    integer := 0;
  v_total      integer := 0;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_challenge from challenges where id = p_challenge_id for update;
  if v_challenge is null then raise exception 'Challenge not found'; end if;
  if v_challenge.status != 'open' then
    raise exception 'This challenge is not accepting applications (status: %)', v_challenge.status;
  end if;
  if v_challenge.creator_id = v_caller then
    raise exception 'You cannot apply to your own challenge';
  end if;
  if exists(select 1 from challenge_applications where challenge_id = p_challenge_id and user_id = v_caller) then
    raise exception 'You have already applied to this challenge';
  end if;

  if p_role_id is not null then
    select * into v_role from challenge_roles where id = p_role_id and challenge_id = p_challenge_id for update;
    if v_role is null then raise exception 'Role not found for this challenge'; end if;
    if v_role.current_count >= v_role.required_count then
      raise exception 'This role slot is already full: %', v_role.role_name;
    end if;
    v_role_name := v_role.role_name;
  end if;

  select array_agg(lower(skill_name)) into v_user_skills
  from user_skill_levels where user_id = v_caller;
  if v_user_skills is null then v_user_skills := '{}'; end if;

  select count(*) into v_total
  from jsonb_array_elements_text(v_challenge.required_skills) s;

  select count(*) into v_matched
  from jsonb_array_elements_text(v_challenge.required_skills) s
  where lower(s.value) = any(v_user_skills);

  if v_total > 0 then
    v_match := round((v_matched::numeric / v_total::numeric) * 100);
  else
    select least(50, reputation_score / 2) into v_match from users where id = v_caller;
    v_match := coalesce(v_match, 0);
  end if;

  v_match := greatest(0, least(100, v_match));

  insert into challenge_applications (challenge_id, user_id, role_id, role_name, message, match_score, status)
  values (p_challenge_id, v_caller, p_role_id, v_role_name, p_message, v_match, 'pending');

  update challenges set applications_count = applications_count + 1, updated_at = now()
  where id = p_challenge_id;

  insert into notifications (user_id, type, message, reference_id)
  values (v_challenge.creator_id, 'new_application',
    'New application for "' || v_challenge.title || '" — ' || v_match || '% match', p_challenge_id);

  return jsonb_build_object('success', true, 'match_score', v_match);
end;
$$;

-- 4.3 ACCEPT APPLICATION
create or replace function public.accept_application(p_application_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_app        record;
  v_challenge  record;
  v_run_id     uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_app from challenge_applications where id = p_application_id for update;
  if v_app is null then raise exception 'Application not found'; end if;
  if v_app.status != 'pending' then raise exception 'Application is not pending (status: %)', v_app.status; end if;

  select * into v_challenge from challenges where id = v_app.challenge_id for update;
  if v_challenge is null then raise exception 'Challenge not found'; end if;
  if v_challenge.creator_id != v_caller then raise exception 'Only the challenge creator can accept applications'; end if;
  if v_challenge.status != 'open' then raise exception 'Challenge is no longer accepting applications (status: %)', v_challenge.status; end if;
  if v_challenge.current_members >= v_challenge.max_squad_size then raise exception 'Squad is already full'; end if;

  update challenge_applications set status = 'accepted' where id = p_application_id;

  update challenges
  set current_members = current_members + 1, updated_at = now()
  where id = v_challenge.id;

  if v_app.role_id is not null then
    update challenge_roles set current_count = current_count + 1 where id = v_app.role_id;
  end if;

  insert into notifications (user_id, type, message, reference_id)
  values (v_app.user_id, 'application_accepted',
    'Your application to "' || v_challenge.title || '" was accepted!', v_challenge.id);

  if v_challenge.current_members + 1 >= v_challenge.max_squad_size then
    update challenges set status = 'full' where id = v_challenge.id;

    insert into challenge_runs (challenge_id, name, description)
    values (v_challenge.id, v_challenge.title, v_challenge.description)
    returning id into v_run_id;

    insert into run_members (run_id, user_id, squad_role)
    values (v_run_id, v_challenge.creator_id, 'leader');

    insert into run_members (run_id, user_id, squad_role)
    select v_run_id, ca.user_id, 'member'
    from challenge_applications ca
    where ca.challenge_id = v_challenge.id and ca.status = 'accepted';

    insert into notifications (user_id, type, message, reference_id)
    select rm.user_id, 'run_started',
      'Challenge run "' || v_challenge.title || '" is live! Your squad is ready.', v_run_id
    from run_members rm
    where rm.run_id = v_run_id;

    update challenge_applications set status = 'rejected'
    where challenge_id = v_challenge.id and status = 'pending';

    insert into notifications (user_id, type, message, reference_id)
    select ca.user_id, 'application_rejected',
      'The challenge "' || v_challenge.title || '" is now full. Your application was not accepted.', v_challenge.id
    from challenge_applications ca
    where ca.challenge_id = v_challenge.id and ca.status = 'rejected'
      and ca.id != p_application_id;

    return jsonb_build_object('success', true, 'run_created', true, 'run_id', v_run_id);
  end if;

  return jsonb_build_object('success', true, 'run_created', false);
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
  v_challenge record;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_app from challenge_applications where id = p_application_id;
  if v_app is null then raise exception 'Application not found'; end if;
  if v_app.status != 'pending' then raise exception 'Application is not pending'; end if;

  select * into v_challenge from challenges where id = v_app.challenge_id;
  if v_challenge.creator_id != v_caller then raise exception 'Only the challenge creator can reject applications'; end if;

  update challenge_applications set status = 'rejected' where id = p_application_id;

  insert into notifications (user_id, type, message, reference_id)
  values (v_app.user_id, 'application_rejected',
    'Your application to "' || v_challenge.title || '" was not accepted.', v_challenge.id);

  return jsonb_build_object('success', true);
end;
$$;

-- 4.5 TOGGLE CHALLENGE LIKE
create or replace function public.toggle_challenge_like(p_challenge_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_exists boolean;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from challenges where id = p_challenge_id) then raise exception 'Challenge not found'; end if;

  select exists(select 1 from challenge_likes where challenge_id = p_challenge_id and user_id = v_caller)
  into v_exists;

  if v_exists then
    delete from challenge_likes where challenge_id = p_challenge_id and user_id = v_caller;
    update challenges set likes_count = greatest(likes_count - 1, 0) where id = p_challenge_id;
    return jsonb_build_object('liked', false);
  else
    insert into challenge_likes (challenge_id, user_id) values (p_challenge_id, v_caller);
    update challenges set likes_count = likes_count + 1 where id = p_challenge_id;

    insert into notifications (user_id, type, message, reference_id)
    select c.creator_id, 'like', 'Someone liked your challenge "' || c.title || '"', p_challenge_id
    from challenges c where c.id = p_challenge_id and c.creator_id != v_caller;

    return jsonb_build_object('liked', true);
  end if;
end;
$$;

-- 4.6 INCREMENT VIEW COUNT
create or replace function public.increment_challenge_views(p_challenge_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update challenges set views_count = views_count + 1 where id = p_challenge_id;
end;
$$;

-- 4.7 ADD COMMENT
create or replace function public.add_comment(
  p_content text,
  p_challenge_id uuid default null,
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
  if p_challenge_id is null and p_post_id is null then raise exception 'Must provide challenge_id or post_id'; end if;
  if p_challenge_id is not null and p_post_id is not null then raise exception 'Cannot set both challenge_id and post_id'; end if;

  insert into comments (user_id, challenge_id, post_id, content)
  values (v_caller, p_challenge_id, p_post_id, p_content)
  returning id into v_id;

  if p_challenge_id is not null then
    update challenges set comments_count = comments_count + 1, updated_at = now()
    where id = p_challenge_id;

    insert into notifications (user_id, type, message, reference_id)
    select c.creator_id, 'comment', 'New comment on "' || c.title || '"', p_challenge_id
    from challenges c where c.id = p_challenge_id and c.creator_id != v_caller;
  end if;

  return v_id;
end;
$$;

-- 4.8 CLAIM MISSION
create or replace function public.claim_mission(p_mission_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_mission record;
  v_active_count integer;
  v_max_active constant integer := 3;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_mission from missions where id = p_mission_id for update;
  if v_mission is null then raise exception 'Mission not found'; end if;
  if v_mission.assigned_to is not null then raise exception 'Mission is already claimed'; end if;
  if v_mission.status = 'completed' then raise exception 'Mission is already completed'; end if;
  if not public.is_run_member(v_mission.run_id) then raise exception 'You are not a member of this run'; end if;

  select count(*) into v_active_count
  from missions where assigned_to = v_caller and status in ('pending','active') and run_id = v_mission.run_id;

  if v_active_count >= v_max_active then
    raise exception 'You already have % active missions in this run (max %)', v_active_count, v_max_active;
  end if;

  update missions set assigned_to = v_caller, status = 'active', updated_at = now()
  where id = p_mission_id;

  insert into activity_feed (run_id, user_id, type, message)
  select v_mission.run_id, v_caller, 'mission_claimed',
    (select username from users where id = v_caller) || ' claimed mission "' || v_mission.title || '"';

  insert into notifications (user_id, type, message, reference_id)
  select rm.user_id, 'mission_assigned', 'Mission "' || v_mission.title || '" has been claimed', v_mission.run_id
  from run_members rm
  where rm.run_id = v_mission.run_id and rm.squad_role = 'leader' and rm.user_id != v_caller;

  return jsonb_build_object('success', true);
end;
$$;

-- 4.9 UPDATE MISSION STATUS
create or replace function public.update_mission_status(p_mission_id uuid, p_status text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_mission record;
  v_xp_gained integer;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if p_status not in ('pending','active','completed') then raise exception 'Invalid status'; end if;

  select * into v_mission from missions where id = p_mission_id;
  if v_mission is null then raise exception 'Mission not found'; end if;
  if not public.is_run_member(v_mission.run_id) then raise exception 'Not a run member'; end if;
  if v_mission.assigned_to is not null and v_mission.assigned_to != v_caller then
    if not exists(select 1 from run_members where run_id = v_mission.run_id and user_id = v_caller and squad_role = 'leader') then
      raise exception 'You can only update missions assigned to you';
    end if;
  end if;

  update missions set status = p_status, updated_at = now() where id = p_mission_id;

  if p_status = 'completed' then
    -- Award XP to the assignee
    if v_mission.assigned_to is not null then
      v_xp_gained := coalesce(v_mission.xp_value, 0);
      update users set xp = xp + v_xp_gained where id = v_mission.assigned_to;
      update challenge_runs set xp_earned = xp_earned + v_xp_gained where id = v_mission.run_id;

      -- Level up check
      update users set level = floor(sqrt(xp / 100.0)) + 1 where id = v_mission.assigned_to;
    end if;

    -- Update run progress
    update challenge_runs set progress_pct = (
      select round((count(*) filter (where status = 'completed')::numeric / nullif(count(*), 0)) * 100)
      from missions where run_id = v_mission.run_id
    ), updated_at = now()
    where id = v_mission.run_id;

    insert into activity_feed (run_id, user_id, type, message)
    select v_mission.run_id, v_caller, 'mission_completed',
      (select username from users where id = v_caller) || ' completed "' || v_mission.title || '" (+" || v_mission.xp_value || " XP)';
  elsif p_status = 'active' then
    insert into activity_feed (run_id, user_id, type, message)
    select v_mission.run_id, v_caller, 'mission_started',
      (select username from users where id = v_caller) || ' started "' || v_mission.title || '"';
  end if;

  return jsonb_build_object('success', true, 'xp_gained', v_xp_gained);
end;
$$;

-- 4.10 START RUN EARLY
create or replace function public.start_run_early(p_challenge_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_challenge  record;
  v_run_id     uuid;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_challenge from challenges where id = p_challenge_id for update;
  if v_challenge is null then raise exception 'Challenge not found'; end if;
  if v_challenge.creator_id != v_caller then raise exception 'Only the challenge creator can start the run'; end if;
  if v_challenge.status not in ('open', 'in_progress') then raise exception 'Challenge cannot be started (status: %)', v_challenge.status; end if;
  if v_challenge.current_members < 2 then raise exception 'You need at least 2 squad members to start a run'; end if;

  if exists(select 1 from challenge_runs where challenge_id = p_challenge_id) then
    raise exception 'Run already exists for this challenge';
  end if;

  update challenges set status = 'in_progress', updated_at = now() where id = p_challenge_id;

  insert into challenge_runs (challenge_id, name, description)
  values (p_challenge_id, v_challenge.title, v_challenge.description)
  returning id into v_run_id;

  insert into run_members (run_id, user_id, squad_role)
  values (v_run_id, v_challenge.creator_id, 'leader');

  insert into run_members (run_id, user_id, squad_role)
  select v_run_id, ca.user_id, 'member'
  from challenge_applications ca
  where ca.challenge_id = p_challenge_id and ca.status = 'accepted';

  insert into notifications (user_id, type, message, reference_id)
  select rm.user_id, 'run_started',
    'Challenge run "' || v_challenge.title || '" has started! Time to build.', v_run_id
  from run_members rm
  where rm.run_id = v_run_id;

  update challenge_applications set status = 'rejected'
  where challenge_id = p_challenge_id and status = 'pending';

  insert into activity_feed (run_id, user_id, type, message)
  values (v_run_id, v_caller, 'run_started',
    (select username from users where id = v_caller) || ' started the run');

  return jsonb_build_object('success', true, 'run_id', v_run_id);
end;
$$;

-- 4.11 COMPLETE RUN
create or replace function public.complete_run(p_run_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_run    record;
  v_xp_reward integer;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;

  select * into v_run from challenge_runs where id = p_run_id for update;
  if v_run is null then raise exception 'Run not found'; end if;

  if not exists(select 1 from run_members where run_id = p_run_id and user_id = v_caller and squad_role = 'leader') then
    raise exception 'Only the run leader can mark it as completed';
  end if;

  if v_run.status = 'completed' then raise exception 'Run is already completed'; end if;

  select coalesce(xp_reward, 0) into v_xp_reward from challenges where id = v_run.challenge_id;

  update challenge_runs set status = 'completed', completed_at = now(), updated_at = now(), xp_earned = xp_earned + v_xp_reward
  where id = p_run_id;

  update challenges set status = 'closed', updated_at = now()
  where id = v_run.challenge_id;

  -- Award completion XP and check level-ups for all squad members
  update users set xp = xp + v_xp_reward,
    level = floor(sqrt((xp + v_xp_reward) / 100.0)) + 1
  where id in (select user_id from run_members where run_id = p_run_id);

  insert into activity_feed (run_id, user_id, type, message)
  values (p_run_id, v_caller, 'run_completed',
    'Run completed! 🎉 Great work squad! +' || v_xp_reward || ' XP for everyone!');

  insert into notifications (user_id, type, message, reference_id)
  select rm.user_id, 'badge_earned',
    'Run "' || v_run.name || '" is complete! +' || v_xp_reward || ' XP earned.', p_run_id
  from run_members rm
  where rm.run_id = p_run_id;

  return jsonb_build_object('success', true, 'xp_reward', v_xp_reward);
end;
$$;

-- 4.12 GET MY MISSIONS
create or replace function public.get_my_missions()
returns table (
  id uuid, run_id uuid, phase_id uuid,
  title text, description text,
  status text, priority text, xp_value int, assigned_to uuid,
  deadline timestamptz, created_at timestamptz, updated_at timestamptz
)
language sql security definer stable set search_path = public
as $$
  select
    m.id, m.run_id, m.phase_id,
    m.title, m.description,
    m.status, m.priority, m.xp_value, m.assigned_to,
    m.deadline, m.created_at, m.updated_at
  from missions m
  join run_members rm on rm.run_id = m.run_id and rm.user_id = auth.uid()
  where m.assigned_to = auth.uid()
  order by
    case m.status when 'active' then 0 when 'pending' then 1 else 2 end,
    case m.priority when 'high' then 0 when 'medium' then 1 else 2 end,
    m.deadline asc nulls last;
$$;

-- 4.13 GET TEAM BALANCE SCORE
create or replace function public.get_team_balance_score(p_challenge_id uuid)
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
  from challenge_roles where challenge_id = p_challenge_id;

  if v_total_slots > 0 then
    v_balance_score := round((v_filled_slots::numeric / v_total_slots::numeric) * 100);
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

-- 4.14 GET RANKED CHALLENGES
create or replace function public.get_ranked_challenges(p_limit int default 20)
returns table (
  id uuid, title text, description text, category text,
  required_skills jsonb, max_squad_size int, current_members int,
  status text, likes_count int, comments_count int,
  applications_count int, views_count int,
  created_at timestamptz, updated_at timestamptz,
  creator_id uuid, rank_score numeric
)
language sql security definer stable set search_path = public
as $$
  select
    c.id, c.title, c.description, c.category,
    c.required_skills, c.max_squad_size, c.current_members,
    c.status, c.likes_count, c.comments_count,
    c.applications_count, c.views_count,
    c.created_at, c.updated_at, c.creator_id,
    (
      (c.current_members::numeric / nullif(c.max_squad_size, 0)) * 40
      + least(c.likes_count, 300)::numeric / 300.0 * 30
      + greatest(0, 20 - (extract(epoch from now() - c.created_at) / 86400.0) * (20.0/7.0))
      + coalesce((
          select least(10, (sum(r.current_count)::numeric / nullif(sum(r.required_count),0)) * 10)
          from challenge_roles r where r.challenge_id = c.id
        ), 0)
    ) as rank_score
  from challenges c
  where c.status = 'open'
  order by rank_score desc
  limit p_limit;
$$;

-- 4.15 TOGGLE BOOKMARK
create or replace function public.toggle_bookmark(p_challenge_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_exists boolean;
begin
  if v_caller is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from challenges where id = p_challenge_id) then raise exception 'Challenge not found'; end if;

  select exists(select 1 from bookmarks where challenge_id = p_challenge_id and user_id = v_caller)
  into v_exists;

  if v_exists then
    delete from bookmarks where challenge_id = p_challenge_id and user_id = v_caller;
    return jsonb_build_object('bookmarked', false);
  else
    insert into bookmarks (challenge_id, user_id) values (p_challenge_id, v_caller);
    return jsonb_build_object('bookmarked', true);
  end if;
end;
$$;

-- 4.16 NOTIFY SKILL MATCHES
create or replace function public.notify_skill_matches(p_challenge_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_challenge record;
  v_role      record;
  v_count     integer := 0;
begin
  select * into v_challenge from challenges where id = p_challenge_id;
  if v_challenge is null then return 0; end if;

  for v_role in
    select * from challenge_roles
    where challenge_id = p_challenge_id and current_count < required_count
  loop
    insert into notifications (user_id, type, message, reference_id)
    select distinct usl.user_id, 'new_application',
      'Your skill "' || v_role.role_name || '" is needed in "' || v_challenge.title || '" — apply now!',
      p_challenge_id
    from user_skill_levels usl
    where lower(usl.skill_name) = lower(v_role.role_name)
      and usl.user_id != v_challenge.creator_id
      and not exists(
        select 1 from challenge_applications ca
        where ca.challenge_id = p_challenge_id and ca.user_id = usl.user_id
      )
    limit 20;

    get diagnostics v_count = row_count;
  end loop;

  return v_count;
end;
$$;

-- 4.17 TRIGGER: auto-notify skill matches when a new challenge_role is inserted
create or replace function public.trigger_notify_skill_matches()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_skill_matches(new.challenge_id);
  return new;
end;
$$;

create trigger on_challenge_role_inserted
  after insert on public.challenge_roles
  for each row execute function public.trigger_notify_skill_matches();

-- 4.18 AWARD BADGE
create or replace function public.award_badge(p_user_id uuid, p_badge_name text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_badge_id uuid;
  v_xp_bonus integer;
begin
  select id, xp_bonus into v_badge_id, v_xp_bonus from badges where name = p_badge_name;
  if v_badge_id is null then raise exception 'Badge not found: %', p_badge_name; end if;
  if exists(select 1 from user_badges where user_id = p_user_id and badge_id = v_badge_id) then
    return jsonb_build_object('success', false, 'reason', 'Already earned');
  end if;

  insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id);

  if v_xp_bonus > 0 then
    update users set xp = xp + v_xp_bonus, level = floor(sqrt(xp / 100.0)) + 1 where id = p_user_id;
  end if;

  insert into notifications (user_id, type, message, reference_id)
  values (p_user_id, 'badge_earned', 'You earned the "' || p_badge_name || '" badge! +' || v_xp_bonus || ' XP', v_badge_id);

  return jsonb_build_object('success', true, 'xp_bonus', v_xp_bonus);
end;
$$;

-- ============================================================
-- 5. ADMIN RPC FUNCTIONS
-- ============================================================

create or replace function public.admin_get_stats()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'total_users',    (select count(*) from users),
    'total_challenges', (select count(*) from challenges),
    'open_challenges', (select count(*) from challenges where status = 'open'),
    'full_challenges', (select count(*) from challenges where status = 'full'),
    'total_runs',     (select count(*) from challenge_runs),
    'active_runs',    (select count(*) from challenge_runs where status = 'active'),
    'total_applications', (select count(*) from challenge_applications),
    'pending_applications', (select count(*) from challenge_applications where status = 'pending')
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_get_users(p_limit int default 100, p_offset int default 0)
returns setof public.users
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query select * from users order by created_at desc limit p_limit offset p_offset;
end;
$$;

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

create or replace function public.admin_delete_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from challenges where id = p_challenge_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_get_challenges(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, title text, description text, category text,
  status text, likes_count int, applications_count int,
  current_members int, max_squad_size int, views_count int,
  created_at timestamptz, creator_id uuid, creator_username text, creator_email text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select c.id, c.title, c.description, c.category,
           c.status, c.likes_count, c.applications_count,
           c.current_members, c.max_squad_size, c.views_count,
           c.created_at, c.creator_id, u.username, u.email
    from challenges c
    join users u on u.id = c.creator_id
    order by c.created_at desc
    limit p_limit offset p_offset;
end;
$$;

create or replace function public.admin_get_runs(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, name text, description text, status text,
  progress_pct int, xp_earned int, created_at timestamptz, member_count bigint, mission_count bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select r.id, r.name, r.description, r.status, r.progress_pct, r.xp_earned, r.created_at,
           (select count(*) from run_members rm where rm.run_id = r.id),
           (select count(*) from missions m where m.run_id = r.id)
    from challenge_runs r
    order by r.created_at desc
    limit p_limit offset p_offset;
end;
$$;

create or replace function public.admin_get_applications(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, challenge_id uuid, challenge_title text, user_id uuid,
  username text, user_email text, role_name text,
  match_score int, status text, created_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
    select a.id, a.challenge_id, c.title, a.user_id,
           u.username, u.email, a.role_name,
           a.match_score, a.status, a.created_at
    from challenge_applications a
    join challenges c on c.id = a.challenge_id
    join users u on u.id = a.user_id
    order by a.created_at desc
    limit p_limit offset p_offset;
end;
$$;

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

create or replace function public.admin_close_challenge(p_challenge_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update challenges set status = 'closed', updated_at = now() where id = p_challenge_id;
  update challenge_applications set status = 'rejected'
  where challenge_id = p_challenge_id and status = 'pending';
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.admin_delete_run(p_run_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from challenge_runs where id = p_run_id;
  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- 6. REALTIME PUBLICATIONS
-- ============================================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.challenge_applications;
alter publication supabase_realtime add table public.challenges;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.missions;
alter publication supabase_realtime add table public.run_members;
