/*
  # Update RLS Policies for Public Audit Access

  1. Security Changes
    - Add public read access policy for accessibility_audits table
    - Add public read access policy for violations table
    - These policies allow anyone to view audit results without authentication
    - Write operations still remain protected (only the service role can insert)
  
  2. Important Notes
    - This enables a public audit tool where anyone can scan websites
    - Audit creation is handled by the edge function using service role key
    - Users can view audit results but cannot modify or delete them
*/

DROP POLICY IF EXISTS "Allow public read access to audits" ON accessibility_audits;
DROP POLICY IF EXISTS "Allow public read access to violations" ON violations;

CREATE POLICY "Allow public read access to audits"
  ON accessibility_audits
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to violations"
  ON violations
  FOR SELECT
  TO anon, authenticated
  USING (true);