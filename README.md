# BuildX — Turn Ideas Into Real Projects

A next-generation social collaboration platform where ideas transform into real projects through small, exclusive teams.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Backend:** Supabase (Auth, PostgreSQL, Realtime)
- **State:** Zustand
- **Icons:** Lucide React

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `env.example` to `.env.local` and fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the database schema in Supabase SQL Editor:
   - Open `supabase/schema.sql` and execute it

### 3. Enable Auth providers

In your Supabase dashboard:
- Enable **Email/Password** auth
- (Optional) Enable **Google OAuth**

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   ├── auth/callback/        # OAuth callback
│   ├── (platform)/           # Authenticated routes
│   │   ├── ideas/            # Ideas feed, create, detail
│   │   ├── projects/         # Projects list, workspace
│   │   ├── profile/          # User profiles, settings
│   │   └── notifications/    # Notifications center
│   └── admin/                # Admin panel (role-protected)
├── components/
│   ├── ui/                   # Shared UI components
│   ├── landing/              # Landing page sections
│   ├── ideas/                # Idea-specific components
│   └── navbar.tsx            # Navigation bar
├── lib/
│   ├── supabase/             # Supabase client setup
│   ├── types.ts              # TypeScript types
│   ├── store.ts              # Zustand state
│   └── utils.ts              # Utility functions
└── middleware.ts              # Auth middleware
```

## Features

- **Landing page** with animated hero, how-it-works, features, and CTA
- **Ideas system** with feed tabs (Trending, New, For You, Almost Full)
- **Application system** — apply to join, accept/reject, auto-lock when full
- **Project workspace** — tasks, chat, members, progress tracking
- **Smart ranking** — engagement, recency, urgency, skill match
- **Profile** with skills, reputation, and project history
- **Admin panel** — user management, content moderation, analytics
- **Real-time notifications**
- **Responsive design** with Framer Motion animations

## Deployment

```bash
npm run build
```

Deploy to Vercel with `vercel` CLI or connect your GitHub repo.
