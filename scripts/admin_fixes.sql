-- Script de Correção do Banco de Dados para o Admin de Convites
-- Execute isto na página do Supabase > SQL Editor > New Query

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA INVITATIONS
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. DESABILITAR TEMPORARIAMENTE RLS PARA PERMITIR ADMINISTRAÇÃO TOTAL (OU ATUALIZAR POLÍTICAS)
-- Como o admin dashboard parece usar auth anônima localmente ou não ter conta logada com super admin,
-- vamos adicionar políticas permissivas para testes e funcionamento inicial

DROP POLICY IF EXISTS "Enable ALL for Plans" ON public.invitation_plans;
CREATE POLICY "Enable ALL for Plans" ON public.invitation_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable ALL for Invitations" ON public.invitations;
CREATE POLICY "Enable ALL for Invitations" ON public.invitations FOR ALL USING (true) WITH CHECK (true);

-- Garantir que as tabelas possuem as políticas acima habilitando
ALTER TABLE public.invitation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Nota: Para um ambiente de produção rigoroso, estas políticas (USING true) devem ser 
-- restritas a usuários autenticados: USING (auth.role() = 'authenticated')
