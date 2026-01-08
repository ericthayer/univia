/*
  Action Plans and Compliance Checklist Tables

  Overview:
  Creates tables for tracking accessibility remediation action plans and WCAG compliance checklist progress.

  New Tables:

  1. action_plans
     Tracks user-created action plans for addressing accessibility issues
     - id (uuid, primary key) - Unique identifier
     - user_id (uuid, nullable) - Reference to auth.users
     - title (text) - Action plan title
     - description (text, nullable) - Detailed description
     - priority (text) - Priority level: critical, high, medium, low
     - status (text) - Status: not_started, in_progress, completed, blocked
     - estimated_effort (text, nullable) - Effort estimate: hours, days, weeks
     - assigned_to (text, nullable) - Person responsible
     - due_date (date, nullable) - Target completion date
     - related_audit_id (uuid, nullable) - Link to accessibility_audits
     - wcag_criteria (text[], nullable) - Related WCAG success criteria
     - notes (text, nullable) - Additional notes
     - created_at (timestamptz) - Creation timestamp
     - updated_at (timestamptz) - Last update timestamp

  2. checklist_progress
     Tracks user progress through WCAG compliance checklist items
     - id (uuid, primary key) - Unique identifier
     - user_id (uuid, nullable) - Reference to auth.users
     - category (text) - Checklist category (e.g., "Content", "Keyboard")
     - item_id (text) - Unique identifier for checklist item
     - completed (boolean) - Completion status
     - notes (text, nullable) - User notes for this item
     - completed_at (timestamptz, nullable) - When marked complete
     - created_at (timestamptz) - Creation timestamp
     - updated_at (timestamptz) - Last update timestamp

  Security:
  - Enable RLS on both tables
  - Users can only access their own action plans and checklist progress
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
*/

CREATE TABLE IF NOT EXISTS action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'not_started',
  estimated_effort text,
  assigned_to text,
  due_date date,
  related_audit_id uuid REFERENCES accessibility_audits(id) ON DELETE SET NULL,
  wcag_criteria text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  item_id text NOT NULL,
  completed boolean DEFAULT false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own action plans"
  ON action_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action plans"
  ON action_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action plans"
  ON action_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own action plans"
  ON action_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own checklist progress"
  ON checklist_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist progress"
  ON checklist_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress"
  ON checklist_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklist progress"
  ON checklist_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_priority ON action_plans(priority);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_user_id ON checklist_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_category ON checklist_progress(category);
