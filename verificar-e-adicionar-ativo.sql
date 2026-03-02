-- Verificar se a coluna ativo existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enderecos' AND column_name = 'ativo';

-- Se não existir, adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enderecos' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN ativo BOOLEAN DEFAULT true NOT NULL;
    RAISE NOTICE 'Coluna ativo adicionada';
  ELSE
    RAISE NOTICE 'Coluna ativo já existe';
  END IF;
END $$;

-- Atualizar todos para ativo = true
UPDATE enderecos SET ativo = true WHERE ativo IS NULL OR ativo = false;

-- Verificar resultado
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE ativo = false) as inativos
FROM enderecos;

-- Verificar endereços com coordenadas
SELECT 
  COUNT(*) as total_com_coordenadas,
  COUNT(*) FILTER (WHERE ativo = true) as ativos_com_coordenadas
FROM enderecos
WHERE lat IS NOT NULL AND long IS NOT NULL;
