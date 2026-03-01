-- Migration: Adicionar latitude e longitude à tabela enderecos
-- Data: 26/02/2026
-- Descrição: Adiciona campos de coordenadas geográficas para localização precisa

-- Adicionar coluna latitude se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enderecos' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN latitude DECIMAL(10, 8);
    COMMENT ON COLUMN enderecos.latitude IS 'Latitude da localização (ex: -23.5505199)';
  END IF;
END $$;

-- Adicionar coluna longitude se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enderecos' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN longitude DECIMAL(11, 8);
    COMMENT ON COLUMN enderecos.longitude IS 'Longitude da localização (ex: -46.6333094)';
  END IF;
END $$;

-- Criar índice para buscas geográficas (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_enderecos_lat_long 
ON enderecos(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comentário na tabela
COMMENT ON TABLE enderecos IS 'Endereços das instalações com coordenadas geográficas';
