
-- ============== ENUMS ==============
CREATE TYPE public.user_role AS ENUM ('athlete', 'coach', 'organizer', 'team_manager');

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'athlete',
  bio TEXT,
  sport TEXT,
  skills TEXT[] DEFAULT '{}',
  achievements TEXT,
  location TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  IF base_username = '' THEN base_username := 'user'; END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, role, sport)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'athlete'),
    NEW.raw_user_meta_data->>'sport'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== POSTS ==============
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX posts_created_idx ON public.posts (created_at DESC);

-- ============== LIKES ==============
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_all" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- ============== COMMENTS ==============
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- ============== FOLLOWS ==============
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ============== TEAMS ==============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  city TEXT,
  captain_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_select_all" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_authed" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "teams_update_captain" ON public.teams FOR UPDATE USING (auth.uid() = captain_id);
CREATE POLICY "teams_delete_captain" ON public.teams FOR DELETE USING (auth.uid() = captain_id);

CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_select_all" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "tm_insert_self" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tm_delete_self" ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- captain auto-joins
CREATE OR REPLACE FUNCTION public.add_captain_as_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id)
  VALUES (NEW.id, NEW.captain_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER teams_captain_join AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.add_captain_as_member();

-- ============== EVENTS ==============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  city TEXT,
  venue TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  poster_url TEXT,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_authed" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "events_update_organizer" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "events_delete_organizer" ON public.events FOR DELETE USING (auth.uid() = organizer_id);

CREATE TABLE public.event_registrations (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "er_select_all" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "er_insert_self" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "er_delete_self" ON public.event_registrations FOR DELETE USING (auth.uid() = user_id);

-- ============== STORAGE BUCKETS ==============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true),
  ('teams', 'teams', true),
  ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all media
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars','covers','posts','teams','events'));

-- Authenticated users can upload to their own folder (folder = uid)
CREATE POLICY "media_user_insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('avatars','covers','posts','teams','events')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "media_user_update" ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('avatars','covers','posts','teams','events')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "media_user_delete" ON storage.objects FOR DELETE
USING (
  bucket_id IN ('avatars','covers','posts','teams','events')
  AND auth.uid()::text = (storage.foldername(name))[1]
);
