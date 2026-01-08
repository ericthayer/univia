/*
  # Enhance Demand Letters for AI Analysis

  ## Overview
  Adds enhanced AI analysis capabilities to the demand_letters table, including
  confidence scoring, processing status tracking, and support for anonymous users.

  ## Changes

  ### 1. Add user_id Column
  - user_id (uuid) - Links demand letters to authenticated users
  - Nullable to support anonymous uploads

  ### 2. New Columns for AI Analysis
  - confidence_scores (jsonb) - Stores confidence scores for each extracted field
  - processing_status (text) - Tracks document processing state
  - ai_model_version (text) - Tracks which AI model version analyzed the document
  - extracted_entities (jsonb) - Structured data from AI entity extraction
  - file_storage_path (text) - Path to original file in Supabase Storage
  - anonymous_session_id (text) - For tracking anonymous user sessions

  ### 3. Indexes
  - Add index on user_id for faster lookups
  - Add index on processing_status for monitoring
  - Add index on anonymous_session_id for anonymous session tracking

  ### 4. Security
  - Anonymous users can INSERT but cannot SELECT others data
  - Authenticated users can only SELECT their own data
  - Service role can access all data for processing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'confidence_scores'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN confidence_scores jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN processing_status text DEFAULT 'completed' 
      CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'ai_model_version'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN ai_model_version text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'extracted_entities'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN extracted_entities jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'file_storage_path'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN file_storage_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demand_letters' AND column_name = 'anonymous_session_id'
  ) THEN
    ALTER TABLE demand_letters ADD COLUMN anonymous_session_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_demand_letters_user_id ON demand_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_demand_letters_processing_status ON demand_letters(processing_status);
CREATE INDEX IF NOT EXISTS idx_demand_letters_anonymous_session ON demand_letters(anonymous_session_id);

DROP POLICY IF EXISTS "Users can view their own demand letters" ON demand_letters;
DROP POLICY IF EXISTS "Users can insert demand letters" ON demand_letters;
DROP POLICY IF EXISTS "Users can update their own demand letters" ON demand_letters;

CREATE POLICY "Authenticated users can view own demand letters"
  ON demand_letters FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Anyone can insert demand letters"
  ON demand_letters FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update own demand letters"
  ON demand_letters FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Service role can manage all demand letters"
  ON demand_letters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
