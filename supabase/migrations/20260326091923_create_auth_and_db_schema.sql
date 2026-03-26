/*
  # CareerLab Auth & Database Schema

  1. New Tables
    - `profiles`: User account info (name, role, learning timeframe)
    - `roadmaps`: Saved skill roadmaps from job descriptions
    - `schedules`: Generated learning plans
    - `progress`: Day-by-day completion tracking
    - `lessons`: Generated lessons for each day

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - All tables linked via user_id to auth.users

  3. Features
    - profiles.id matches auth.users.id (auto-populated)
    - RLS ensures complete data isolation
    - Foreign keys maintain referential integrity
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  level text,
  days integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  jd_text text NOT NULL,
  roadmap_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roadmaps"
  ON roadmaps FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own roadmaps"
  ON roadmaps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own roadmaps"
  ON roadmaps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id uuid REFERENCES roadmaps(id) ON DELETE CASCADE,
  plan_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  topic text,
  skill text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress"
  ON progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  quiz_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own lessons"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lessons"
  ON lessons FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
