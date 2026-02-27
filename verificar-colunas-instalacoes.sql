-- Verificar TODAS as colunas da tabela instalacoes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'instalacoes'
ORDER BY ordinal_position;
