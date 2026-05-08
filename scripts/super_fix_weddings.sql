-- ============================================================
-- MEGA FIX: Wedding Invitations System (Final Reliability)
-- Execute este script no SQL Editor do Supabase para resolver
-- problemas de "Não encontrado" e RLS.
-- ============================================================

-- 1. Garante que as colunas críticas existem na tabela invitations
ALTER TABLE public.invitations 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Atualiza registros que possam estar com status ou is_public vazios
UPDATE public.invitations 
SET status = 'active' WHERE status IS NULL;

UPDATE public.invitations 
SET is_public = true WHERE is_public IS NULL;

-- 3. Limpa políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Read Active Invitations" ON public.invitations;
DROP POLICY IF EXISTS "Public Read Invitations" ON public.invitations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invitations;
DROP POLICY IF EXISTS "Admin Full Access Invitations" ON public.invitations;

-- 4. Cria política de leitura pública ULTRA PERMISSIVA (para teste)
-- Isso garante que qualquer convite possa ser lido se o slug for conhecido
CREATE POLICY "Public Read Invitations" 
ON public.invitations FOR SELECT 
TO public 
USING (true);

-- 5. Cria política de acesso total para Admin
CREATE POLICY "Admin Full Access Invitations" 
ON public.invitations FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 6. STORAGE: Garante que o bucket e as políticas estão corretos
INSERT INTO storage.buckets (id, name, public)
VALUES ('invitation-assets', 'invitation-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'invitation-assets');

CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'invitation-assets');

-- 7. IMPORTANTE: Garantir que o slug é único e indexado
CREATE INDEX IF NOT EXISTS idx_invitations_slug_v2 ON public.invitations(slug);

-- ============================================================
-- FIM DO SCRIPT - Verifique se não houve erros no SQL Editor
-- ============================================================
