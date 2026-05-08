-- ============================================================
-- MIGRAÇÃO: Sistema de Convites Digitais - Fase 1
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. TABELA DE PEDIDOS (formulário de checkout de convites)
CREATE TABLE IF NOT EXISTS public.invitation_orders (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    plan_id         UUID REFERENCES public.invitation_plans(id) ON DELETE SET NULL,
    plan_name       TEXT,                           -- snapshot do nome do plano
    
    -- Dados dos noivos
    couple_names    TEXT NOT NULL,                  -- "Maria & João"
    event_date      DATE NOT NULL,
    event_location  TEXT NOT NULL,
    event_time      TEXT,                           -- "15:00"
    bride_name      TEXT,
    groom_name      TEXT,
    couple_message  TEXT,                           -- mensagem de abertura
    
    -- Contatos do cliente
    client_phone    TEXT,
    client_email    TEXT,
    
    -- Extras
    dress_code      TEXT,
    
    -- Música
    music_title     TEXT,                           -- título se não fez upload
    music_artist    TEXT,                           -- artista se não fez upload
    music_url       TEXT,                           -- URL do ficheiro se fez upload
    
    -- Lista de presentes (JSON array: [{name, price}])
    gifts_list      JSONB DEFAULT '[]',
    
    -- Ficheiros (URLs guardadas no Supabase Storage)
    cover_photo_url TEXT,
    gallery_urls    JSONB DEFAULT '[]',             -- array de URLs de fotos
    video_urls      JSONB DEFAULT '[]',             -- array de URLs de vídeos
    
    -- Status do pedido
    status          TEXT NOT NULL DEFAULT 'new'     -- new | paid | in_production | completed | cancelled
                    CHECK (status IN ('new', 'paid', 'in_production', 'completed', 'cancelled')),
    payment_method  TEXT,                           -- whatsapp | online
    
    -- Referência ao convite (preenchido quando o admin cria o convite)
    invitation_id   UUID REFERENCES public.invitations(id) ON DELETE SET NULL,
    
    -- Metadados
    notes           TEXT,                           -- notas internas do admin
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE TEMPLATES
CREATE TABLE IF NOT EXISTS public.invitation_templates (
    id          UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name        TEXT NOT NULL,
    category    TEXT DEFAULT 'wedding',             -- wedding | birthday | corporate
    description TEXT,
    preview_url TEXT,                               -- screenshot do template
    html_code   TEXT,                               -- HTML completo do template
    css_code    TEXT,
    js_code     TEXT,
    variables   JSONB DEFAULT '{}',                 -- variáveis configuráveis do template
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. ADICIONAR COLUNAS AO invitations (se não existirem)
ALTER TABLE public.invitations
    ADD COLUMN IF NOT EXISTS couple_password   TEXT,         -- senha de acesso à dashboard dos noivos
    ADD COLUMN IF NOT EXISTS guest_link        TEXT,         -- URL pública do convite (slug é a base)
    ADD COLUMN IF NOT EXISTS couple_link       TEXT,         -- URL da dashboard dos noivos
    ADD COLUMN IF NOT EXISTS order_id          UUID REFERENCES public.invitation_orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS template_id       UUID REFERENCES public.invitation_templates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS html_content      TEXT,         -- HTML final do convite
    ADD COLUMN IF NOT EXISTS event_time        TEXT,
    ADD COLUMN IF NOT EXISTS event_location    TEXT,
    ADD COLUMN IF NOT EXISTS cover_photo_url   TEXT,
    ADD COLUMN IF NOT EXISTS gallery_urls      JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS music_url         TEXT,
    ADD COLUMN IF NOT EXISTS music_title       TEXT,
    ADD COLUMN IF NOT EXISTS music_artist      TEXT,
    ADD COLUMN IF NOT EXISTS video_urls        JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS gifts_list        JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS dress_code        TEXT,
    ADD COLUMN IF NOT EXISTS couple_message    TEXT,
    ADD COLUMN IF NOT EXISTS groom_name        TEXT,
    ADD COLUMN IF NOT EXISTS bride_name        TEXT,
    ADD COLUMN IF NOT EXISTS memory_gallery_active BOOLEAN DEFAULT false; -- galeria de memórias do dia

-- 4. TRIGGER: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invitation_orders_updated_at ON public.invitation_orders;
CREATE TRIGGER set_invitation_orders_updated_at
    BEFORE UPDATE ON public.invitation_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. RLS - HABILITAR
ALTER TABLE public.invitation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS

-- invitation_orders: apenas admin pode ver/editar tudo
-- público pode inserir novos pedidos
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.invitation_orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.invitation_orders;

CREATE POLICY "Admin Full Access Orders"
    ON public.invitation_orders FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Public Insert Orders"
    ON public.invitation_orders FOR INSERT TO public
    WITH CHECK (true);

-- invitation_templates: admin gere, público lê
DROP POLICY IF EXISTS "Admin Full Access Templates" ON public.invitation_templates;
DROP POLICY IF EXISTS "Public Read Templates" ON public.invitation_templates;

CREATE POLICY "Admin Full Access Templates"
    ON public.invitation_templates FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Templates"
    ON public.invitation_templates FOR SELECT TO public
    USING (is_active = true);

-- invitations: noivos (por senha) podem ler o seu convite via função RPC
-- (A verificação por senha será feita no frontend com RPC/API, não com RLS direto)

-- 7. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_invitation_orders_status ON public.invitation_orders(status);
CREATE INDEX IF NOT EXISTS idx_invitation_orders_created_at ON public.invitation_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_couple_password ON public.invitations(couple_password);

-- 8. FUNÇÃO RPC: verificar senha dos noivos e retornar dados do convite
CREATE OR REPLACE FUNCTION public.get_invitation_by_password(p_password TEXT)
RETURNS JSON AS $$
DECLARE
    inv RECORD;
    result JSON;
BEGIN
    SELECT * INTO inv FROM public.invitations
    WHERE couple_password = p_password AND status = 'active'
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    SELECT json_build_object(
        'id', inv.id,
        'slug', inv.slug,
        'title', inv.title,
        'customer_name', inv.customer_name,
        'bride_name', inv.bride_name,
        'groom_name', inv.groom_name,
        'event_date', inv.event_date,
        'event_time', inv.event_time,
        'event_location', inv.event_location,
        'cover_photo_url', inv.cover_photo_url,
        'gallery_urls', inv.gallery_urls,
        'music_url', inv.music_url,
        'music_title', inv.music_title,
        'couple_message', inv.couple_message,
        'dress_code', inv.dress_code,
        'gifts_list', inv.gifts_list,
        'memory_gallery_active', inv.memory_gallery_active
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que qualquer utilizador chame esta função
GRANT EXECUTE ON FUNCTION public.get_invitation_by_password TO public;

-- ============================================================
-- FIM DA MIGRAÇÃO - Execute isto no Supabase SQL Editor
-- ============================================================
