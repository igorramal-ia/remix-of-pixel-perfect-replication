-- ============================================
-- SCRIPT: Adicionar Latitude e Longitude
-- Data: 26/02/2026
-- Descrição: Adiciona coordenadas geográficas à tabela enderecos
-- ============================================

-- PASSO 1: Adicionar coluna latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enderecos' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN latitude DECIMAL(10, 8);
    COMMENT ON COLUMN enderecos.latitude IS 'Latitude da localização (ex: -23.5505199)';
    RAISE NOTICE 'Coluna latitude adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna latitude já existe.';
  END IF;
END $$;

-- PASSO 2: Adicionar coluna longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enderecos' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN longitude DECIMAL(11, 8);
    COMMENT ON COLUMN enderecos.longitude IS 'Longitude da localização (ex: -46.6333094)';
    RAISE NOTICE 'Coluna longitude adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna longitude já existe.';
  END IF;
END $$;

-- PASSO 3: Criar índice para buscas geográficas
CREATE INDEX IF NOT EXISTS idx_enderecos_lat_long 
ON enderecos(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

RAISE NOTICE 'Índice idx_enderecos_lat_long criado!';

-- PASSO 4: Verificar resultado
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'enderecos'
AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

-- PASSO 5: Contar endereços com e sem coordenadas
SELECT 
  COUNT(*) as total_enderecos,
  COUNT(latitude) as com_latitude,
  COUNT(longitude) as com_longitude,
  COUNT(*) - COUNT(latitude) as sem_latitude,
  COUNT(*) - COUNT(longitude) as sem_longitude
FROM enderecos;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- column_name | data_type | numeric_precision | numeric_scale | is_nullable
-- ------------|-----------|-------------------|---------------|-------------
-- latitude    | numeric   | 10                | 8             | YES
-- longitude   | numeric   | 11                | 8             | YES
-- ============================================

-- ============================================
-- EXEMPLO: Como preencher coordenadas
-- ============================================

-- Exemplo 1: Atualizar um endereço específico
-- UPDATE enderecos
-- SET 
--   latitude = -23.5505199,
--   longitude = -46.6333094
-- WHERE endereco = 'Rua Exemplo, 123';

-- Exemplo 2: Atualizar vários endereços de uma vez
-- UPDATE enderecos e
-- SET 
--   latitude = c.latitude,
--   longitude = c.longitude
-- FROM (VALUES
--   ('uuid-endereco-1', -23.5505199, -46.6333094),
--   ('uuid-endereco-2', -23.5505200, -46.6333095),
--   ('uuid-endereco-3', -23.5505201, -46.6333096)
-- ) AS c(id, latitude, longitude)
-- WHERE e.id = c.id::uuid;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
