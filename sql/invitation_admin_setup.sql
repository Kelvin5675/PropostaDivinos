-- ============================================
-- SCRIPT SQL: NOVAS TABELAS PARA MÓDULO
-- DE CONVITES DIGITAIS (ADMIN SEPARADO)
-- ============================================
-- Execute este script no Supabase SQL Editor

-- 1. Tabela: FAQ da Landing Page de Convites
CREATE TABLE IF NOT EXISTS invitation_faq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna 'color' e 'description' e 'features_list' à tabela invitation_plans (se não existir)
ALTER TABLE invitation_plans
    ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6d28d9',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS features_list TEXT;

-- 3. Adicionar coluna 'views_count' à tabela invitations (se não existir)
ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 4. Configurações da Landing Page (upsert para não duplicar)
-- Garante que as chaves base existam com valores padrão
INSERT INTO site_settings (key, value) VALUES
    ('inv_lp_hero_title', 'Convites Digitais<br><span class="accent">Únicos & Inesquecíveis</span>'),
    ('inv_lp_hero_subtitle', 'Celebre os seus momentos especiais com convites digitais personalizados, com RSVP integrado, música de fundo e animações exclusivas.'),
    ('inv_lp_btn1_text', 'Ver Planos'),
    ('inv_lp_btn1_link', '#planos'),
    ('inv_lp_btn2_text', 'Falar Connosco'),
    ('inv_lp_btn2_link', 'https://wa.me/258828800311'),
    ('inv_lp_mockup_video', ''),
    ('inv_lp_features', '[]')
ON CONFLICT (key) DO NOTHING;

-- 5. FAQ padrão inicial
INSERT INTO invitation_faq (question, answer, display_order) VALUES
    ('Por quanto tempo o link fica activo?', 'Dependendo do plano escolhido, o convite fica activo entre 30 dias a 1 ano após a data do evento.', 1),
    ('Posso alterar informações após a criação?', 'Sim! Alterações simples de texto são feitas em até 24h sem custo adicional no primeiro mês.', 2),
    ('O convite funciona em qualquer telemóvel?', 'Sim! Os convites funcionam perfeitamente em todos os telemóveis e navegadores modernos (Android, iPhone, etc.).', 3),
    ('Como faço para pagar?', 'Aceitamos M-Pesa, e-Mola e transferência bancária. Após escolher o plano, receberá as instruções de pagamento via WhatsApp.', 4)
ON CONFLICT DO NOTHING;

-- 6. RLS (Row Level Security) - Permitir leitura pública do FAQ
ALTER TABLE invitation_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_read_faq"
    ON invitation_faq FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY IF NOT EXISTS "admin_all_faq"
    ON invitation_faq FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
