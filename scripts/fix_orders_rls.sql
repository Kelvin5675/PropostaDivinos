-- Script para consertar o Bug do Reset de Pedidos
-- Problema: A política de RLS padrão não permitia a deleção (DELETE) de vários ou todos os registros na tabela 'orders' por usuários autenticados (Admin).
-- Solução: Criar políticas explícitas permitindo a manipulação total (UPDATE, DELETE) na tabela 'orders' para quem está logado.

-- 1. Certificar que a tabela 'orders' tem RLS ativado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Permitir inserção pública (já que clientes não logados criam pedidos no checkout)
-- Nota: Remove a regra existente se houver conflito, depois recria
DROP POLICY IF EXISTS "Permitir Inserção Pública de Pedidos" ON orders;
CREATE POLICY "Permitir Inserção Pública de Pedidos" 
ON orders FOR INSERT 
WITH CHECK (true);

-- 3. Permitir Leitura Pública (apenas para verificação de recibos se aplicável, ou restrito)
DROP POLICY IF EXISTS "Permitir Leitura de Pedidos" ON orders;
CREATE POLICY "Permitir Leitura de Pedidos" 
ON orders FOR SELECT 
USING (true);

-- 4. Criar Política para Deletar Pedidos (Apenas pessoas autenticadas - Admin)
DROP POLICY IF EXISTS "Permitir Deleção de Pedidos a Administradores" ON orders;
CREATE POLICY "Permitir Deleção de Pedidos a Administradores" 
ON orders FOR DELETE 
USING (auth.role() = 'authenticated');

-- 5. Criar Política para Atualizar Pedidos (Mudar Status)
DROP POLICY IF EXISTS "Permitir Atualização de Pedidos a Administradores" ON orders;
CREATE POLICY "Permitir Atualização de Pedidos a Administradores" 
ON orders FOR UPDATE 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Pronto! Execute este script completo no editor SQL do seu Supabase.
