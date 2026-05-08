-- =============================================
-- STORAGE BUCKET: invitation-assets
-- =============================================

-- 1. Insert bucket definition
INSERT INTO storage.buckets (id, name, public)
VALUES ('invitation-assets', 'invitation-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clear existing policies for this bucket to avoid duplicates
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- 3. Create public read policy
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invitation-assets');

-- 4. Create public insert policy (for checkout uploads)
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'invitation-assets');

-- 5. Create admin full access policy
CREATE POLICY "Admin Full Access"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'invitation-assets')
WITH CHECK (bucket_id = 'invitation-assets');
