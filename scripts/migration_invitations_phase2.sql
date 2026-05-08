-- ============================================================
-- MIGRAÇÃO: Sistema de Convites Digitais - Fase 2
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. TABELA DE RSVP (Confirmações de Presença)
CREATE TABLE IF NOT EXISTS public.invitations_rsvp (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    invitation_id   UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name      TEXT NOT NULL,
    adult_count     INT DEFAULT 1,
    child_count     INT DEFAULT 0,
    is_attending    BOOLEAN NOT NULL DEFAULT true,
    phone           TEXT,
    dietary_notes   TEXT,                           -- restrições alimentares
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE MENSAGENS (Mural de Recados)
CREATE TABLE IF NOT EXISTS public.invitations_messages (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    invitation_id   UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name      TEXT NOT NULL,
    message         TEXT NOT NULL,
    is_approved     BOOLEAN DEFAULT false,          -- moderação pelo admin/noivos
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HABILITAR RLS
ALTER TABLE public.invitations_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations_messages ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS - RSVP
-- Público pode inserir RSVPs
DROP POLICY IF EXISTS "Public Insert RSVP" ON public.invitations_rsvp;
CREATE POLICY "Public Insert RSVP"
    ON public.invitations_rsvp FOR INSERT TO public
    WITH CHECK (true);

-- Admin e Noivos podem ver RSVPs (Noivos via função RPC ou Política baseada em slug/token se implementado)
-- Para simplificar agora, permitimos select autenticado para o admin
DROP POLICY IF EXISTS "Admin Select RSVP" ON public.invitations_rsvp;
CREATE POLICY "Admin Select RSVP"
    ON public.invitations_rsvp FOR SELECT TO authenticated
    USING (true);

-- 5. POLÍTICAS RLS - MENSAGENS
-- Público pode inserir mensagens
DROP POLICY IF EXISTS "Public Insert Messages" ON public.invitations_messages;
CREATE POLICY "Public Insert Messages"
    ON public.invitations_messages FOR INSERT TO public
    WITH CHECK (true);

-- Público pode ler apenas mensagens aprovadas
DROP POLICY IF EXISTS "Public Read Approved Messages" ON public.invitations_messages;
CREATE POLICY "Public Read Approved Messages"
    ON public.invitations_messages FOR SELECT TO public
    USING (is_approved = true);

-- Admin/Noivos podem ver e editar todas
DROP POLICY IF EXISTS "Admin Full Access Messages" ON public.invitations_messages;
CREATE POLICY "Admin Full Access Messages"
    ON public.invitations_messages FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_rsvp_invitation_id ON public.invitations_rsvp(invitation_id);
CREATE INDEX IF NOT EXISTS idx_messages_invitation_id ON public.invitations_messages(invitation_id);
CREATE INDEX IF NOT EXISTS idx_messages_approved ON public.invitations_messages(is_approved);

-- ============================================================
-- FIM DA MIGRAÇÃO - Fase 2
-- ============================================================
