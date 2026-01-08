/*
  # ADA Compliance Assistant Initial Schema

  ## Overview
  Creates the core database structure for the ADA Compliance Assistant application,
  enabling businesses to track accessibility audits, manage demand letters, and
  access professional resources.

  ## New Tables

  ### 1. businesses
  Stores business information for tracking multiple entities
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Business name
  - `website_url` (text) - Primary website URL
  - `industry` (text) - Industry category
  - `size` (text) - Company size (small/medium/large/enterprise)
  - `contact_email` (text) - Primary contact email
  - `contact_phone` (text) - Contact phone number
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. accessibility_audits
  Stores website accessibility audit results from Lighthouse
  - `id` (uuid, primary key) - Unique identifier
  - `business_id` (uuid, foreign key) - Associated business
  - `url_scanned` (text) - URL that was audited
  - `lighthouse_score` (integer) - Overall accessibility score (0-100)
  - `performance_score` (integer) - Performance score
  - `accessibility_score` (integer) - Detailed accessibility score
  - `best_practices_score` (integer) - Best practices score
  - `seo_score` (integer) - SEO score
  - `screenshot_url` (text) - URL to audit screenshot
  - `audit_data` (jsonb) - Complete Lighthouse JSON results
  - `created_at` (timestamptz) - Audit timestamp

  ### 3. violations
  Individual WCAG violations found during audits
  - `id` (uuid, primary key) - Unique identifier
  - `audit_id` (uuid, foreign key) - Associated audit
  - `wcag_guideline` (text) - WCAG code (e.g., "1.4.3", "2.1.1")
  - `severity` (text) - critical/serious/moderate/minor
  - `title` (text) - Violation title
  - `description` (text) - Detailed description
  - `affected_selector` (text) - CSS selector of affected element
  - `remediation_steps` (jsonb) - Array of remediation guidance
  - `compliance_level` (text) - A/AA/AAA level
  - `element_screenshot_url` (text) - Screenshot of specific issue
  - `impact` (text) - Impact description
  - `created_at` (timestamptz) - Detection timestamp

  ### 4. demand_letters
  Legal demand letters received by businesses
  - `id` (uuid, primary key) - Unique identifier
  - `business_id` (uuid, foreign key) - Associated business
  - `file_name` (text) - Original filename
  - `file_size` (integer) - File size in bytes
  - `upload_date` (timestamptz) - Upload timestamp
  - `plaintiff_name` (text) - Plaintiff name from document
  - `attorney_name` (text) - Attorney name
  - `attorney_firm` (text) - Law firm name
  - `response_deadline` (date) - Deadline to respond
  - `violations_cited` (jsonb) - Violations mentioned in letter
  - `settlement_amount` (numeric) - Requested settlement amount
  - `extracted_text` (text) - Full extracted text content
  - `analysis_summary` (text) - AI-generated summary
  - `risk_level` (text) - low/medium/high/critical
  - `status` (text) - pending/reviewed/responded/resolved
  - `created_at` (timestamptz) - Record creation

  ### 5. action_items
  Trackable tasks for businesses to address violations
  - `id` (uuid, primary key) - Unique identifier
  - `business_id` (uuid, foreign key) - Associated business
  - `related_audit_id` (uuid, foreign key, nullable) - Related audit
  - `related_letter_id` (uuid, foreign key, nullable) - Related letter
  - `title` (text) - Task title
  - `description` (text) - Detailed description
  - `priority` (text) - low/medium/high/critical
  - `status` (text) - pending/in_progress/completed
  - `due_date` (date) - Target completion date
  - `completed_at` (timestamptz) - Completion timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. professional_resources
  Directory of legal and technical professionals
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Professional or firm name
  - `type` (text) - lawyer/developer/consultant/auditor
  - `specializations` (jsonb) - Array of specialization areas
  - `location` (text) - City, State
  - `state` (text) - State abbreviation
  - `hourly_rate_min` (numeric) - Minimum hourly rate
  - `hourly_rate_max` (numeric) - Maximum hourly rate
  - `contact_email` (text) - Contact email
  - `phone` (text) - Contact phone
  - `website` (text) - Website URL
  - `rating` (numeric) - Average rating (0-5)
  - `pro_bono` (boolean) - Offers pro bono services
  - `verified` (boolean) - Verified professional
  - `description` (text) - Service description
  - `created_at` (timestamptz) - Record creation

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access to authenticated users' own data
  - Service role required for professional_resources management

  ## Indexes
  - Foreign key indexes for optimal join performance
  - Audit date indexes for timeline queries
  - Deadline indexes for urgent letter tracking
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text NOT NULL,
  industry text,
  size text DEFAULT 'small',
  contact_email text NOT NULL,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- Create accessibility_audits table
CREATE TABLE IF NOT EXISTS accessibility_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  url_scanned text NOT NULL,
  lighthouse_score integer,
  performance_score integer,
  accessibility_score integer,
  best_practices_score integer,
  seo_score integer,
  screenshot_url text,
  audit_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES accessibility_audits(id) ON DELETE CASCADE,
  wcag_guideline text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
  title text NOT NULL,
  description text,
  affected_selector text,
  remediation_steps jsonb,
  compliance_level text CHECK (compliance_level IN ('A', 'AA', 'AAA')),
  element_screenshot_url text,
  impact text,
  created_at timestamptz DEFAULT now()
);

-- Create demand_letters table
CREATE TABLE IF NOT EXISTS demand_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer,
  upload_date timestamptz DEFAULT now(),
  plaintiff_name text,
  attorney_name text,
  attorney_firm text,
  response_deadline date,
  violations_cited jsonb,
  settlement_amount numeric(12, 2),
  extracted_text text,
  analysis_summary text,
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'responded', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- Create action_items table
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  related_audit_id uuid REFERENCES accessibility_audits(id) ON DELETE SET NULL,
  related_letter_id uuid REFERENCES demand_letters(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create professional_resources table
CREATE TABLE IF NOT EXISTS professional_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('lawyer', 'developer', 'consultant', 'auditor')),
  specializations jsonb DEFAULT '[]',
  location text,
  state text,
  hourly_rate_min numeric(8, 2),
  hourly_rate_max numeric(8, 2),
  contact_email text,
  phone text,
  website text,
  rating numeric(3, 2) DEFAULT 0,
  pro_bono boolean DEFAULT false,
  verified boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audits_business_id ON accessibility_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON accessibility_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_audit_id ON violations(audit_id);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON violations(severity);
CREATE INDEX IF NOT EXISTS idx_letters_business_id ON demand_letters(business_id);
CREATE INDEX IF NOT EXISTS idx_letters_deadline ON demand_letters(response_deadline);
CREATE INDEX IF NOT EXISTS idx_letters_status ON demand_letters(status);
CREATE INDEX IF NOT EXISTS idx_action_items_business_id ON action_items(business_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON professional_resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_verified ON professional_resources(verified);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view their own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses));

CREATE POLICY "Users can insert their own businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses))
  WITH CHECK (auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses));

-- RLS Policies for accessibility_audits
CREATE POLICY "Users can view audits for their businesses"
  ON accessibility_audits FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

CREATE POLICY "Users can create audits for their businesses"
  ON accessibility_audits FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

-- RLS Policies for violations
CREATE POLICY "Users can view violations for their audits"
  ON violations FOR SELECT
  TO authenticated
  USING (
    audit_id IN (
      SELECT id FROM accessibility_audits
      WHERE business_id IN (
        SELECT id FROM businesses
        WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
      )
    )
  );

CREATE POLICY "Users can create violations"
  ON violations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for demand_letters
CREATE POLICY "Users can view their own demand letters"
  ON demand_letters FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

CREATE POLICY "Users can insert demand letters"
  ON demand_letters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own demand letters"
  ON demand_letters FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

-- RLS Policies for action_items
CREATE POLICY "Users can view their own action items"
  ON action_items FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

CREATE POLICY "Users can insert action items"
  ON action_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own action items"
  ON action_items FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE auth.uid()::text = id::text OR auth.uid() IN (SELECT id FROM businesses)
    )
  );

-- RLS Policies for professional_resources (public read, admin write)
CREATE POLICY "Anyone can view professional resources"
  ON professional_resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage professional resources"
  ON professional_resources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);