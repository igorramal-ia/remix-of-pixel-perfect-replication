# Correção: RLS Policies Duplicadas em Notificações

## Problema
Erro ao criar campanha: "new row violates row-level security policy for table 'notificacoes'"

Ao tentar criar policies manualmente, erro: "policy 'Admins can insert notificacoes' for table 'notificacoes' already exists"

## Causa
1. Policies duplicadas na tabela `notificacoes`
2. Tentativa de criar policies que já existem
3. RLS bloqueando INSERT de notificações

## Solução

### Opção 1: Executar Script SQL Direto (Mais Rápido)

Abrir SQL Editor do Supabase e executar:

```sql
-- Remover policies existentes
DROP POLICY IF EXISTS "Admins can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Operacoes can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

-- Criar policy unificada para INSERT
CREATE POLICY "Admins and operacoes can insert notificacoes"
ON public.notificacoes FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') OR 
  public.has_role(auth.uid(), 'operacoes')
);

-- Policy para SELECT
CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy para UPDATE
CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir RLS habilitado
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
```

### Opção 2: Aplicar Migration (Recomendado)

```bash
npx supabase db push
```

Aplica a migration: `20260225220000_fix_notificacoes_rls_policies.sql`

## Estrutura das Policies

### 1. INSERT (Admins e Operações)
```sql
CREATE POLICY "Admins and operacoes can insert notificacoes"
ON public.notificacoes FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') OR 
  public.has_role(auth.uid(), 'operacoes')
);
```

**Quem pode**: Administradores e Operações
**O que pode**: Criar notificações para qualquer usuário

### 2. SELECT (Próprio Usuário)
```sql
CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

**Quem pode**: Qualquer usuário autenticado
**O que pode**: Ver apenas suas próprias notificações

### 3. UPDATE (Próprio Usuário)
```sql
CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Quem pode**: Qualquer usuário autenticado
**O que pode**: Atualizar apenas suas próprias notificações (ex: marcar como lida)

## Por Que o Erro Ocorria?

### Cenário 1: Policies Duplicadas
```sql
-- Policy 1 (antiga)
CREATE POLICY "Admins can insert notificacoes" ...

-- Policy 2 (tentativa de criar novamente)
CREATE POLICY "Admins can insert notificacoes" ...  -- ❌ ERRO: já existe
```

**Solução**: Usar `DROP POLICY IF EXISTS` antes de criar

### Cenário 2: RLS Bloqueando INSERT
```sql
-- Sem policy de INSERT ou policy muito restritiva
INSERT INTO notificacoes (...) VALUES (...);  -- ❌ ERRO: RLS bloqueou
```

**Solução**: Criar policy que permite INSERT para admins/operações

## Fluxo de Criação de Notificação

```typescript
// src/hooks/useNotificacoes.ts
export function useCriarNotificacao() {
  return useMutation({
    mutationFn: async (notificacao: {
      user_id: string;
      titulo: string;
      mensagem: string;
    }) => {
      // Esta query precisa passar pela RLS policy
      const { data, error } = await supabase
        .from("notificacoes")
        .insert(notificacao)  // ✅ Permitido se user é admin/operações
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

## Verificações

### 1. Ver policies atuais
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notificacoes';
```

**Resultado esperado:**
```
policyname                                | cmd    | qual                    | with_check
------------------------------------------|--------|-------------------------|---------------------------
Admins and operacoes can insert notifica… | INSERT | NULL                    | (has_role(auth.uid(), …))
Users can view own notificacoes           | SELECT | (user_id = auth.uid())  | NULL
Users can update own notificacoes         | UPDATE | (user_id = auth.uid())  | (user_id = auth.uid())
```

### 2. Testar INSERT como admin
```sql
-- Logar como admin e testar
INSERT INTO notificacoes (user_id, titulo, mensagem)
VALUES (auth.uid(), 'Teste', 'Mensagem de teste')
RETURNING *;
```

Deve funcionar se você é admin ou operações.

### 3. Verificar função has_role
```sql
-- Verificar se a função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'has_role';

-- Testar função
SELECT public.has_role(auth.uid(), 'administrador');
```

Deve retornar `true` se você é admin.

## Possíveis Problemas

### Problema 1: Função has_role não existe
```
ERROR: function public.has_role(uuid, unknown) does not exist
```

**Solução**: Criar a função (deve estar em migration anterior)
```sql
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Problema 2: Policy ainda bloqueando
```
new row violates row-level security policy
```

**Causa**: Usuário logado não é admin/operações
**Solução**: Verificar role do usuário
```sql
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

### Problema 3: RLS desabilitado
```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notificacoes';
```

Se `rowsecurity = false`, habilitar:
```sql
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
```

## Como Testar

1. Aplicar correção (script SQL ou migration)
2. Verificar policies criadas
3. Ir para página de Campanhas
4. Criar nova campanha
5. Verificar se notificação é criada sem erro

## Arquivos Criados

1. `fix-notificacoes-policies.sql` - Script SQL direto
2. `supabase/migrations/20260225220000_fix_notificacoes_rls_policies.sql` - Migration
3. `CORRECAO_RLS_NOTIFICACOES.md` - Este documento

## Status

⚠️ Aguardando aplicação da correção
- [ ] Executar script SQL OU aplicar migration
- [ ] Verificar policies criadas
- [ ] Testar criação de campanha
- [ ] Confirmar que notificação é criada

## Resumo

**Problema**: Policies duplicadas e RLS bloqueando INSERT
**Solução**: Remover policies antigas e criar novas unificadas
**Ação**: Executar `fix-notificacoes-policies.sql` no SQL Editor
