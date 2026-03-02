-- Verificar se a coluna 'ativo' existe na tabela enderecos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enderecos'
  AND column_name = 'ativo';

-- Se não existir, adicionar a coluna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'enderecos'
      AND column_name = 'ativo'
  ) THEN
    ALTER TABLE enderecos ADD COLUMN ativo BOOLEAN DEFAULT true NOT NULL;
    
    -- Atualizar todos os registros existentes para ativo = true
    UPDATE enderecos SET ativo = true WHERE ativo IS NULL;
    
    RAISE NOTICE 'Coluna ativo adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna ativo já existe';
  END IF;
END $$;

-- Verificar resultado
SELECT 
  COUNT(*) as total_enderecos,
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE ativo = false) as inativos
FROM enderecos;
