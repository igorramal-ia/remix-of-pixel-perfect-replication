# Como Aplicar a Migration de UF

## ⚠️ IMPORTANTE: Fazer Backup Primeiro!

Antes de aplicar qualquer migration, faça backup dos dados:

```sql
-- Backup da tabela profiles (especialmente territorios)
CREATE TABLE profiles_backup_20260226 AS 
SELECT * FROM profiles WHERE territorios IS NOT NULL;

-- Verificar backup
SELECT COUNT(*) FROM profiles_backup_20260226;
```

## Passo 1: Aplicar Migration

### Opção A: Via Supabase CLI (Recomendado)

```bash
cd supabase
supabase db push
```

### Opção B: Via SQL Editor no Supabase Dashboard

1. Abra o Supabase Dashboard
2. Vá em "SQL Editor"
3. Copie e cole o conteúdo de `supabase/migrations/20260226010000_change_territorios_to_uf.sql`
4. Execute

## Passo 2: Verificar Migration

Execute estas queries para verificar se tudo funcionou:

```sql
-- 1. Verificar se função nova existe
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'coordenador_cobre_uf';
-- Deve retornar 1 linha

-- 2. Verificar se função antiga foi removida
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'coordenador_cobre_endereco';
-- Deve retornar 0 linhas

-- 3. Ver estrutura dos territorios migrados
SELECT 
  id,
  nome,
  territorios,
  jsonb_typeof(territorios) as tipo,
  territorios->'ufs' as ufs_extraidas
FROM profiles 
WHERE territorios IS NOT NULL
ORDER BY nome;

-- 4. Contar coordenadores com UFs
SELECT 
  COUNT(*) as total_coordenadores,
  COUNT(CASE WHEN jsonb_array_length(territorios->'ufs') > 0 THEN 1 END) as com_ufs,
  COUNT(CASE WHEN jsonb_array_length(territorios->'ufs') = 0 THEN 1 END) as sem_ufs
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

## Passo 3: Ajustes Manuais (Se Necessário)

Se algum coordenador ficou sem UF após a migration, você pode adicionar manualmente:

```sql
-- Exemplo: Adicionar SP para um coordenador específico
UPDATE profiles
SET territorios = '{"ufs": ["SP"]}'::jsonb
WHERE id = 'UUID_DO_COORDENADOR';

-- Exemplo: Adicionar múltiplas UFs
UPDATE profiles
SET territorios = '{"ufs": ["SP", "RJ", "MG"]}'::jsonb
WHERE id = 'UUID_DO_COORDENADOR';
```

## Passo 4: Testar Função Nova

```sql
-- Teste 1: Coordenador cobre SP
SELECT coordenador_cobre_uf(
  '{"ufs": ["SP", "RJ"]}'::jsonb,
  'SP'
);
-- Deve retornar: TRUE

-- Teste 2: Coordenador NÃO cobre MG
SELECT coordenador_cobre_uf(
  '{"ufs": ["SP", "RJ"]}'::jsonb,
  'MG'
);
-- Deve retornar: FALSE

-- Teste 3: Territorios vazio
SELECT coordenador_cobre_uf(
  '{}'::jsonb,
  'SP'
);
-- Deve retornar: FALSE
```

## Passo 5: Verificar Dados Reais

```sql
-- Ver todos os coordenadores e suas UFs
SELECT 
  p.nome,
  p.email,
  p.territorios->'ufs' as ufs,
  jsonb_array_length(p.territorios->'ufs') as qtd_ufs
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.nome;
```

## Rollback (Se Necessário)

Se algo der errado, você pode restaurar do backup:

```sql
-- Restaurar territorios do backup
UPDATE profiles p
SET territorios = b.territorios
FROM profiles_backup_20260226 b
WHERE p.id = b.id;

-- Recriar função antiga (se necessário)
-- Copiar de: supabase/migrations/20260225160000_add_territorios_to_profiles.sql
```

## Problemas Comuns

### Problema 1: Migration não migrou dados automaticamente
**Solução**: Adicionar UFs manualmente para cada coordenador

### Problema 2: Função antiga ainda existe
**Solução**: Executar manualmente:
```sql
DROP FUNCTION IF EXISTS public.coordenador_cobre_endereco(JSONB, TEXT, TEXT);
```

### Problema 3: Coordenadores sem UF
**Solução**: Identificar e adicionar:
```sql
-- Listar coordenadores sem UF
SELECT p.id, p.nome, p.email
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
  AND (
    p.territorios IS NULL 
    OR jsonb_array_length(p.territorios->'ufs') = 0
  );

-- Adicionar UF para cada um
UPDATE profiles SET territorios = '{"ufs": ["SP"]}'::jsonb WHERE id = 'UUID';
```

## Checklist Final

- [ ] Backup criado
- [ ] Migration aplicada
- [ ] Função `coordenador_cobre_uf` existe
- [ ] Função `coordenador_cobre_endereco` foi removida
- [ ] Todos os coordenadores têm pelo menos 1 UF
- [ ] Testes da função passaram
- [ ] Frontend atualizado (Users.tsx, NovaCampanhaModalV2.tsx)
- [ ] Testado criar novo coordenador
- [ ] Testado editar coordenador existente
- [ ] Testado criar campanha com filtro por UF

## Próximos Passos

Após aplicar a migration e verificar que tudo está funcionando:

1. Testar cadastro de novo coordenador
2. Testar edição de coordenador existente
3. Testar criação de campanha
4. Implementar funcionalidade de trocar coordenador
5. Atualizar dashboard do coordenador
