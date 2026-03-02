-- 1. Verificar se a coluna existe
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'campanhas' 
  AND column_name IN ('criado_por', 'gestor_id');

-- 2. Ver dados de uma campanha específica
SELECT 
  c.id,
  c.nome,
  c.cliente,
  c.gestor_id,
  c.criado_por,
  c.criado_em,
  p_gestor.nome as gestor_nome,
  p_criador.nome as criador_nome
FROM campanhas c
LEFT JOIN profiles p_gestor ON c.gestor_id = p_gestor.id
LEFT JOIN profiles p_criador ON c.criado_por = p_criador.id
ORDER BY c.criado_em DESC
LIMIT 5;

-- 3. Forçar atualização: definir criado_por = gestor_id para todas as campanhas
UPDATE campanhas 
SET criado_por = gestor_id 
WHERE criado_por IS NULL AND gestor_id IS NOT NULL;

-- 4. Verificar resultado
SELECT 
  COUNT(*) as total_campanhas,
  COUNT(criado_por) as com_criador,
  COUNT(gestor_id) as com_gestor,
  COUNT(*) - COUNT(criado_por) as sem_criador
FROM campanhas;

-- 5. Ver campanhas sem criador
SELECT id, nome, gestor_id, criado_por
FROM campanhas
WHERE criado_por IS NULL;
