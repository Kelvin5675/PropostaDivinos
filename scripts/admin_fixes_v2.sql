-- Script de Correção do Banco de Dados para o Admin de Convites (PARTE 2)
-- Execute isto na página do Supabase > SQL Editor > New Query

-- 1. ADICIONAR COLUNAS QUE ESTAVAM FALTANDO NA TABELA INVITATIONS
-- A tabela original provavelmente foi criada antes dessas novas funcionalidades
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS custom_html TEXT,
ADD COLUMN IF NOT EXISTS editor_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS couple_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.invitation_plans(id),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- NOTA: O Supabase pode manter a estrutura antiga no cache ("schema cache"). 
-- Se depois de rodar este comando ainda der erro 400, vá nas configurações do Supabase 
-- (Project Settings > API) e clique no botão "Reload cache" do DataAPI.
