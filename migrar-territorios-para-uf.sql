-- Script para migrar territórios existentes de cidades/comunidades para UF
-- Execute este script no SQL Editor do Supabase

-- 1. Ver dados atuais (antes da migração)
SELECT 
  id,
  nome,
  email,
  territorios,
  jsonb_typeof(territorios) as tipo
FROM profiles 
WHERE territorios IS NOT NULL
ORDER BY nome;

-- 2. Migrar dados existentes
-- Este script tenta extrair a UF dos endereços que o coordenador cobre

UPDATE profiles
SET territorios = jsonb_build_object(
  'ufs', 
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT e.uf)
      FROM enderecos e
      WHERE 
        -- Tenta encontrar UF baseado nas cidades listadas
        (territorios->'cidades' ? e.cidade)
        OR
        -- Ou baseado nas comunidades listadas
        (territorios->'comunidades' ? e.comunidade)
    ),
    '[]'::jsonb
  )
)
WHERE territorios IS NOT NULL 
  AND (
    territorios ? 'cidades'
    OR
    territorios ? 'comunidades'
  );

-- 3. Ver dados após migração
SELECT 
  id,
  nome,
  email,
  territorios,
  territorios->'ufs' as ufs_extraidas,
  jsonb_array_length(territorios->'ufs') as qtd_ufs
FROM profiles 
WHERE territorios IS NOT NULL
ORDER BY nome;

-- 4. Se algum coordenador ficou sem UF, adicionar manualmente
-- Exemplo para o Arlindo (ajuste o ID e UF conforme necessário):
-- UPDATE profiles 
-- SET territorios = '{"ufs": ["SP"]}'::jsonb
-- WHERE email = 'arlindo@exemplo.com';

-- 5. Verificar coordenadores sem UF
SELECT 
  id,
  nome,
  email,
  territorios
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
  AND (
    territorios IS NULL 
    OR NOT (territorios ? 'ufs')
    OR jsonb_array_length(territorios->'ufs') = 0
  );
