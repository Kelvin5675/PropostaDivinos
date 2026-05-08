-- Adicionar novos campos à tabela products para suportar a nova página de detalhes

-- 1. Campo de desconto percentual
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- 2. Campo de avaliação (rating de 0 a 5)
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0;

-- 3. Número de reviews/avaliações
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- 4. SKU do produto
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- 5. Tags do produto (array de strings)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 6. Tamanhos disponíveis (array de strings, ex: ["30ml", "60ml", "80ml", "100ml"])
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- 7. Descrição longa (usado na tab "Description")
ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;

-- 8. Informações adicionais (usado na tab "Additional Information")
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_info JSONB;

-- 9. Especificações técnicas
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;

-- 10. Badge/Label (ex: "Sale", "New", "Hot")
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;

-- Comentários para documentação
COMMENT ON COLUMN products.discount_percentage IS 'Percentual de desconto (0-100)';
COMMENT ON COLUMN products.rating IS 'Avaliação média do produto (0.0-5.0)';
COMMENT ON COLUMN products.review_count IS 'Número total de avaliações';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - código único do produto';
COMMENT ON COLUMN products.tags IS 'Tags do produto para busca e categorização';
COMMENT ON COLUMN products.sizes IS 'Tamanhos/volumes disponíveis';
COMMENT ON COLUMN products.long_description IS 'Descrição detalhada para a página de produto';
COMMENT ON COLUMN products.additional_info IS 'Informações adicionais em formato JSON (ex: atributos, especificações)';
COMMENT ON COLUMN products.specifications IS 'Especificações técnicas do produto';
COMMENT ON COLUMN products.badge IS 'Badge visual (Sale, New, Hot, etc)';

-- Exemplo de atualização para produtos existentes (opcional)
-- UPDATE products SET 
--   sku = 'PRD' || LPAD(id::text, 6, '0'),
--   rating = 4.5,
--   review_count = 120,
--   tags = ARRAY['Popular', 'Bestseller'],
--   sizes = ARRAY['Pequeno', 'Médio', 'Grande']
-- WHERE id = 1;
