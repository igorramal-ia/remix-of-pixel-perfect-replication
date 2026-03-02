-- Debug: Verificar dados reais do sistema

-- 1. Total de endereços ativos
SELECT COUNT(*) as total_enderecos_ativos
FROM enderecos
WHERE ativo = true;

-- 2. Endereços por estado
SELECT uf, COUNT(*) as total
FROM enderecos
WHERE ativo = true
GROUP BY uf
ORDER BY total DESC;

-- 3. Endereços ocupados (com instalação ativa ou pendente)
SELECT COUNT(DISTINCT e.id) as enderecos_ocupados
FROM enderecos e
INNER JOIN instalacoes i ON i.endereco_id = e.id
WHERE e.ativo = true
  AND i.status IN ('ativa', 'pendente');

-- 4. Endereços disponíveis (sem instalação ativa ou pendente)
SELECT COUNT(*) as enderecos_disponiveis
FROM enderecos e
WHERE e.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM instalacoes i
    WHERE i.endereco_id = e.id
      AND i.status IN ('ativa', 'pendente')
  );

-- 5. Verificar instalações por status
SELECT status, COUNT(*) as total
FROM instalacoes
GROUP BY status;
