-- ============================================
-- CORREÇÃO ESPECÍFICA: RO DE JANEIRO → Rio De Janeiro
-- ============================================

-- Verificar se o problema existe
SELECT cidade, COUNT(*) as quantidade
FROM enderecos
WHERE cidade ILIKE 'ro de janeiro'
   OR cidade ILIKE 'ro%janeiro'
GROUP BY cidade;

-- Corrigir "RO DE JANEIRO" para "Rio De Janeiro"
UPDATE enderecos
SET cidade = 'Rio De Janeiro'
WHERE cidade ILIKE 'ro de janeiro'
   OR cidade ILIKE 'ro%janeiro';

-- Verificar correção
SELECT DISTINCT cidade
FROM enderecos
WHERE cidade ILIKE '%rio%'
ORDER BY cidade;

-- Resultado esperado: Rio De Janeiro
