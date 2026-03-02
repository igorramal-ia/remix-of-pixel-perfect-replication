-- Verificar todas as colunas da tabela instalacoes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'instalacoes'
ORDER BY ordinal_position;

-- Verificar se as colunas necessárias existem
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalacoes' AND column_name = 'endereco_id') 
    THEN 'SIM' ELSE 'NÃO' END as tem_endereco_id,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalacoes' AND column_name = 'status') 
    THEN 'SIM' ELSE 'NÃO' END as tem_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalacoes' AND column_name = 'data_retirada_real') 
    THEN 'SIM' ELSE 'NÃO' END as tem_data_retirada_real,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instalacoes' AND column_name = 'campanha_id') 
    THEN 'SIM' ELSE 'NÃO' END as tem_campanha_id;

-- Contar instalações
SELECT 
  COUNT(*) as total_instalacoes,
  COUNT(*) FILTER (WHERE status = 'ativa') as ativas,
  COUNT(*) FILTER (WHERE status = 'finalizada') as finalizadas,
  COUNT(*) FILTER (WHERE status = 'pendente') as pendentes
FROM instalacoes;

-- Ver algumas instalações de exemplo
SELECT id, endereco_id, campanha_id, status, data_retirada_real
FROM instalacoes
LIMIT 5;
