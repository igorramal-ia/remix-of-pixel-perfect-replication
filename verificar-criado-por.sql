-- Verificar se a coluna criado_por existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campanhas' AND column_name = 'criado_por';

-- Verificar dados das campanhas
SELECT 
  id,
  nome,
  gestor_id,
  criado_por,
  criado_em
FROM campanhas
ORDER BY criado_em DESC
LIMIT 5;

-- Contar campanhas com e sem criado_por
SELECT 
  COUNT(*) as total,
  COUNT(criado_por) as com_criador,
  COUNT(*) - COUNT(criado_por) as sem_criador
FROM campanhas;
