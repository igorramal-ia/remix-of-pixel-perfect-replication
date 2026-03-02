-- Verificar endereços em SP

-- 1. Total de endereços ativos
SELECT COUNT(*) as total_ativos
FROM enderecos
WHERE ativo = true;

-- 2. Endereços por estado
SELECT uf, COUNT(*) as total
FROM enderecos
WHERE ativo = true
GROUP BY uf
ORDER BY total DESC;

-- 3. Verificar se existe coluna 'uf' e seus valores
SELECT DISTINCT uf
FROM enderecos
WHERE ativo = true
ORDER BY uf;

-- 4. Endereços em SP especificamente
SELECT COUNT(*) as total_sp
FROM enderecos
WHERE ativo = true
  AND uf = 'SP';

-- 5. Verificar se há problema com case (maiúscula/minúscula)
SELECT COUNT(*) as total_sp_ilike
FROM enderecos
WHERE ativo = true
  AND UPPER(uf) = 'SP';

-- 6. Mostrar alguns exemplos de endereços
SELECT id, endereco, cidade, uf, ativo
FROM enderecos
WHERE ativo = true
LIMIT 10;
