/*
  # Add device_type to accessibility_audits

  1. Changes
    - Adds `device_type` column to `accessibility_audits` table
      - Type: text with CHECK constraint
      - Allowed values: 'mobile', 'desktop'
      - Default: 'desktop' (to maintain backward compatibility)
      - NOT NULL constraint ensures all audits have a device type
    
    - Creates index on `device_type` for efficient filtering by device type

  2. Migration Safety
    - Uses IF NOT EXISTS checks to prevent errors if column already exists
    - Sets default value for existing rows
    - Adds constraint only after column is created

  3. Performance
    - Index enables fast queries filtering by device type
    - Supports efficient aggregations for mobile vs desktop metrics
*/

-- Add device_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accessibility_audits' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE accessibility_audits ADD COLUMN device_type text DEFAULT 'desktop' NOT NULL;
  END IF;
END $$;

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'accessibility_audits' AND constraint_name = 'accessibility_audits_device_type_check'
  ) THEN
    ALTER TABLE accessibility_audits ADD CONSTRAINT accessibility_audits_device_type_check 
      CHECK (device_type IN ('mobile', 'desktop'));
  END IF;
END $$;

-- Create index on device_type for performance
CREATE INDEX IF NOT EXISTS idx_audits_device_type ON accessibility_audits(device_type);

-- Create composite index for filtering by user and device type
CREATE INDEX IF NOT EXISTS idx_audits_user_device ON accessibility_audits(user_id, device_type, created_at DESC);
