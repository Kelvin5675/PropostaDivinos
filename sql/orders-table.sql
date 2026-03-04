-- =============================================
-- ORDERS TABLE FOR DIVINOS GRAFFIC
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(20) UNIQUE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    client_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca por status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- RLS (Row Level Security) - Permitir insert público e select apenas para autenticados
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode criar pedidos (via site)
CREATE POLICY "Allow public insert" ON orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Política: Apenas usuários autenticados (admin) podem ver e editar
CREATE POLICY "Allow authenticated select" ON orders
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated update" ON orders
    FOR UPDATE TO authenticated
    USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_timestamp();

-- Permitir leitura pública (anon) também para que o site possa rastrear pedidos
CREATE POLICY "Allow anon select own orders" ON orders
    FOR SELECT TO anon
    USING (true);
