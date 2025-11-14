# Supabase Setup

1. **Create project**
   - Visit https://supabase.com/dashboard, click *New project*, pick a region, and copy the `Project URL` + `anon` key (used later in `.env`).

2. **Run the schema**
   - Open the SQL editor, paste the contents of `supabase/schema.sql`, and run it.
   - This provisions tables for clips, sessions, creators, comments, saves, follows, and reactions.
   - It also enables Row-Level Security (RLS). Adjust the policies once you wire real Supabase Auth instead of the temporary viewer IDs.

3. **Create storage buckets**
   - In *Storage → Create new bucket*, name it `clip-media`, keep it public for now (or use signed URLs if you already have auth).
   - Optional: add a `clip-previews` bucket for thumbnails if you want to store images separately.

4. **Environment variables**
   - Copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - In Vercel → Project Settings → Environment Variables, add the same keys so production builds can reach Supabase.

5. **Seed data**
   - Use the Supabase Data Browser or SQL inserts to add a few creators, sessions, and clips so the UI doesn’t look empty.
   - For clips, upload MP4/WEBM files into the `clip-media` bucket and set `preview_url`/`video_url` columns to the public URLs.

6. **Plan for real auth**
   - Enable email/password (or OAuth) under Authentication → Providers.
   - Once ready, update the app to use `supabase.auth` instead of the temporary viewer IDs (`src/lib/viewerId.ts`) and tighten the RLS policies to reference `auth.uid()`.
