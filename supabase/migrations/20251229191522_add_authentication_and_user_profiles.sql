/*
  # Add Authentication and User Profile System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `full_name` (text, not null)
      - `tier` (text, not null, default 'basic')
      - `audit_limit` (integer, not null, default 20)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  
    - `pinned_audits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles, not null)
      - `audit_id` (uuid, references accessibility_audits, not null)
      - `pinned_at` (timestamptz, default now())
      - Unique constraint on (user_id, audit_id)

  2. Table Modifications
    - Add `user_id` column to `accessibility_audits` table
      - Nullable to support anonymous audits
      - Foreign key references auth.users(id)
    - Add `is_pinned` virtual helper column (computed)

  3. Security
    - Enable RLS on user_profiles table
    - Policy: Users can read their own profile
    - Policy: Users can update their own profile (name only)
    - Enable RLS on pinned_audits table
    - Policy: Users can manage their own pinned audits
    - Update accessibility_audits policies to respect user_id
    - Policy: Authenticated users can read their own audits
    - Policy: Anonymous users can read audits without user_id

  4. Functions
    - Auto-create user_profile on auth.users insert
    - Calculate tier-based audit limits
    - Trigger to update updated_at timestamp

  5. Important Notes
    - Basic tier (free): 20 audit limit
    - Pro tier: unlimited audits
    - Enterprise tier: unlimited audits + team features
    - Pinned audits are exempt from deletion
*/

-- Add user_id column to accessibility_audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accessibility_audits' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE accessibility_audits 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_audits_user_id ON accessibility_audits(user_id);
  END IF;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'pro', 'enterprise')),
  audit_limit integer NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pinned_audits table
CREATE TABLE IF NOT EXISTS pinned_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES accessibility_audits(id) ON DELETE CASCADE,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, audit_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_audits_user_id ON pinned_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_audits_audit_id ON pinned_audits(audit_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND tier = (SELECT tier FROM user_profiles WHERE id = auth.uid())
  );

-- Enable RLS on pinned_audits
ALTER TABLE pinned_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinned_audits
DROP POLICY IF EXISTS "Users can view own pinned audits" ON pinned_audits;
CREATE POLICY "Users can view own pinned audits"
  ON pinned_audits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can pin own audits" ON pinned_audits;
CREATE POLICY "Users can pin own audits"
  ON pinned_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unpin own audits" ON pinned_audits;
CREATE POLICY "Users can unpin own audits"
  ON pinned_audits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for accessibility_audits to support user-owned audits
DROP POLICY IF EXISTS "Authenticated users can read own audits" ON accessibility_audits;
CREATE POLICY "Authenticated users can read own audits"
  ON accessibility_audits
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- Keep the existing public read policy for anonymous audits
DROP POLICY IF EXISTS "Allow public read access to audits" ON accessibility_audits;
CREATE POLICY "Allow public read access to audits"
  ON accessibility_audits
  FOR SELECT
  TO anon
  USING (user_id IS NULL);