/*
  # Add User Management Fields

  1. Changes to user_profiles table
    - Add `is_admin` (boolean) - Flag for admin users
    - Add `status` (varchar) - User status (active, inactive, churned)
    - Add `audit_count` (integer) - Count of audits performed by user
    - Add `last_login` (timestamptz) - Last login timestamp
    - Add index on is_admin for quick admin lookups
    - Add index on status for filtering

  2. Security
    - Maintain existing RLS policies
    - Ensure only admins can view is_admin field through app logic

  3. Notes
    - Default status is 'active' for all existing users
    - Default is_admin is false for security
    - audit_count defaults to 0
    - last_login defaults to created_at for existing users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN status varchar(20) DEFAULT 'active' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'audit_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN audit_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_login timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'last_login'
    AND column_default IS NULL
  ) THEN
    UPDATE user_profiles
    SET last_login = created_at
    WHERE last_login IS NULL;
  END IF;
END $$;