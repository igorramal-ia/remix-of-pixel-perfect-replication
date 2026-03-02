-- Validar respostas da IA Consultiva

-- 1. Quantos endereços em SP? (IA disse: 239)
SELECT COUNT(*) as total_enderecos_sp
FROM enderecos
WHERE ativo = true
  AND uf = 'SP';

-- 2. Quantos endereços estão disponíveis? (IA disse: 664)
-- Disponíveis = Total ativos - Ocupados (com instalação ativa ou pendente)
SELECT 
  (SELECT COUNT(*) FROM enderecos WHERE ativo = true) as total_ativos,
  (SELECT COUNT(DISTINCT endereco_id) 
   FROM instalacoes 
   WHERE status IN ('ativa', 'pendente')) as ocupados,
  (SELECT COUNT(*) FROM enderecos WHERE ativo = true) - 
  (SELECT COUNT(DISTINCT endereco_id) 
   FROM instalacoes 
   WHERE status IN ('ativa', 'pendente')) as disponiveis;

-- 3. Total de endereços por estado
SELECT uf, COUNT(*) as total
FROM enderecos
WHERE ativo = true
GROUP BY uf
ORDER BY total DESC;

-- 4. Total de instalações
SELECT COUNT(*) as total_instalacoes
FROM instalacoes;

-- 5. Instalações por status
SELECT status, COUNT(*) as total
FROM instalacoes
GROUP BY status
ORDER BY total DESC;

-- 6. Instalações em SP (precisa JOIN com enderecos)
SELECT COUNT(*) as instalacoes_em_sp
FROM instalacoes i
INNER JOIN enderecos e ON e.id = i.endereco_id
WHERE e.ativo = true
  AND e.uf = 'SP';
