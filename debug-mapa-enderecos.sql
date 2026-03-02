-- Verificar endereços com coordenadas e status ativo
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE lat IS NOT NULL AND long IS NOT NULL) as com_coordenadas,
  COUNT(*) FILTER (WHERE lat IS NOT NULL AND long IS NOT NULL AND ativo = true) as ativos_com_coordenadas,
  COUNT(*) FILTER (WHERE ativo = true) as total_ativos,
  COUNT(*) FILTER (WHERE ativo = false) as total_inativos
FROM enderecos;

-- Ver alguns exemplos de endereços
SELECT id, endereco, lat, long, status, ativo
FROM enderecos
WHERE lat IS NOT NULL AND long IS NOT NULL
LIMIT 5;

-- Verificar se a coluna ativo existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'enderecos' AND column_name = 'ativo';
