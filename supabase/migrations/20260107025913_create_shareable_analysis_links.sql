/*
  # Shareable Analysis Links System

  ## Overview
  Creates a system for generating shareable links to demand letter analysis results.
  Enables anonymous access to shared analyses and link management for users.

  ## New Table

  ### shared_analysis_links
  Stores shareable link configurations for demand letter analyses
  - id (uuid, primary key) - Unique identifier
  - share_token (text, unique) - Random token used in URL
  - letter_id (uuid, foreign key) - References demand_letters
  - created_by (uuid, foreign key) - User who created the share link
  - expires_at (timestamptz, nullable) - Optional expiration date
  - access_count (integer) - Number of times accessed
  - max_access_count (integer, nullable) - Optional access limit
  - password_hash (text, nullable) - Optional password protection
  - revoked_at (timestamptz, nullable) - When link was revoked
  - created_at (timestamptz) - Creation timestamp

  ## Indexes
  - Unique index on share_token for fast lookups
  - Index on letter_id for finding all shares of a letter
  - Index on created_by for user's share management
  - Index on expires_at for cleanup of expired links

  ## Security
  - Enable RLS on shared_analysis_links
  - Users can view their own shared links
  - Users can create share links for their own letters
  - Users can update their own share links
  - Public can access shared analysis via valid token
  - Service role can manage all links
*/

CREATE TABLE IF NOT EXISTS shared_analysis_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text UNIQUE NOT NULL,
  letter_id uuid REFERENCES demand_letters(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  access_count integer DEFAULT 0,
  max_access_count integer,
  password_hash text,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_analysis_links(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_links_letter_id ON shared_analysis_links(letter_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_created_by ON shared_analysis_links(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_links_expires_at ON shared_analysis_links(expires_at);

ALTER TABLE shared_analysis_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shared links"
  ON shared_analysis_links FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = created_by);

CREATE POLICY "Users can create shared links"
  ON shared_analysis_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = created_by
    AND EXISTS (
      SELECT 1 FROM demand_letters
      WHERE demand_letters.id = letter_id
      AND demand_letters.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own shared links"
  ON shared_analysis_links FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can delete own shared links"
  ON shared_analysis_links FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

CREATE POLICY "Service role can manage all shared links"
  ON shared_analysis_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view non-revoked active shared links"
  ON shared_analysis_links FOR SELECT
  TO anon
  USING (
    revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_access_count IS NULL OR access_count < max_access_count)
  );