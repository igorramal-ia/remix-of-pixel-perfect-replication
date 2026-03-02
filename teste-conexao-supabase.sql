-- Script simples para testar conexão com Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Teste básico - deve retornar a data/hora atual
SELECT NOW() as data_hora_servidor;

-- 2. Verificar se as tabelas principais existem
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'campanhas', 'enderecos', 'instalacoes') THEN '✓ OK'
    ELSE '? Desconhecida'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. Contar registros nas tabelas principais
SELECT 
  'profiles' as tabela,
  COUNT(*) as total
FROM profiles
UNION ALL
SELECT 'campanhas', COUNT(*) FROM campanhas
UNION ALL
SELECT 'enderecos', COUNT(*) FROM enderecos
UNION ALL
SELECT 'instalacoes', COUNT(*) FROM instalacoes;

-- 4. Verificar último registro criado
SELECT 
  'Última campanha' as tipo,
  nome as descricao,
  created_at
FROM campanhas
ORDER BY created_at DESC
LIMIT 1;
