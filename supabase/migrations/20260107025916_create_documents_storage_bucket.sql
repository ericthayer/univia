/*
  # Create Storage Bucket for Demand Letter Documents

  ## Overview
  Creates a Supabase Storage bucket for storing uploaded demand letter documents.

  ## New Storage Bucket
  - Bucket name: demand-letters
  - Public: false (files are private)
  - File size limit: 10MB
  - Allowed MIME types: PDF and images

  ## Security Policies
  - Authenticated users can upload files
  - Users can only access their own uploaded files
  - Service role can access all files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demand-letters',
  'demand-letters',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload demand letters"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'demand-letters'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can view own demand letter files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can update own demand letter files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'demand-letters'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Users can delete own demand letter files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'demand-letters'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "Service role can manage all demand letter files"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'demand-letters')
  WITH CHECK (bucket_id = 'demand-letters');