-- Verificar se coluna grupo_id existe em instalacoes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'instalacoes' 
  AND column_name = 'grupo_id';

-- Se não existir, ver todas as colunas
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'instalacoes'
ORDER BY ordinal_position;
