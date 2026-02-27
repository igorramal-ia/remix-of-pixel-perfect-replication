# Corrigir Territórios - Guia Rápido

## Problema
Coordenadores cadastrados têm formato antigo (`cidades` e `comunidades`) mas o código novo espera `ufs`.

## Solução Rápida (2 minutos)

### Passo 1: Abrir SQL Editor no Supabase
1. Ir no Supabase Dashboard
2. Clicar em "SQL Editor" no menu lateral

### Passo 2: Executar Script de Migração
Copie e cole este script:

```sql
-- Migrar territórios de cidades/comunidades para UF
UPDATE profiles
SET territorios = jsonb_build_object(
  'ufs', 
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT e.uf)
      FROM enderecos e
      WHERE 
        (territorios->'cidades' ? e.cidade)
        OR
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

-- Ver resultado
SELECT 
  nome,
  email,
  territorios->'ufs' as ufs
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

### Passo 3: Adicionar UF Manualmente (Se Necessário)

Se algum coordenador ficou sem UF, adicione manualmente:

```sql
-- Para o Arlindo (ajuste o email)
UPDATE profiles 
SET territorios = '{"ufs": ["SP"]}'::jsonb
WHERE email = 'arar@df.com';

-- Para o Coordenador teste
UPDATE profiles 
SET territorios = '{"ufs": ["SP"]}'::jsonb
WHERE email = 'coordenador@dfdf.com';
```

### Passo 4: Verificar
```sql
-- Ver todos os coordenadores e suas UFs
SELECT 
  nome,
  email,
  territorios->'ufs' as ufs,
  jsonb_array_length(territorios->'ufs') as qtd_ufs
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

## Resultado Esperado

Antes:
```json
{
  "cidades": ["São Paulo"],
  "comunidades": ["Cantinho Do Céu"]
}
```

Depois:
```json
{
  "ufs": ["SP"]
}
```

## Testar

1. Recarregar página "Gerenciar Usuários"
2. Verificar se coordenadores mostram badges de UF
3. Criar nova campanha
4. Verificar se coordenadores aparecem no filtro

## Se Ainda Não Funcionar

Execute este comando para ver o que está no banco:

```sql
SELECT 
  nome,
  email,
  territorios,
  jsonb_typeof(territorios) as tipo,
  territorios ? 'ufs' as tem_ufs,
  territorios ? 'cidades' as tem_cidades
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

E me mande o resultado.
