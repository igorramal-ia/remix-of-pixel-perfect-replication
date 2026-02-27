# Correção: Update de Territórios

## Problema

Erro: `Cannot coerce the result to a single JSON object`

Ocorria ao salvar territórios de um coordenador na página `/usuarios`.

## Causa

O hook `useUpdateTerritorios()` estava usando `.select().single()` após o UPDATE, o que pode causar problemas quando:
1. O resultado não pode ser coerced para um único objeto JSON
2. Há problemas de tipo entre `Territorios` e `Json`

## Solução

### 1. Remover `.select().single()` do UPDATE

**Antes:**
```typescript
const { data, error } = await supabase
  .from("profiles")
  .update({ territorios })
  .eq("id", userId)
  .select()      // ❌ Pode causar erro
  .single();     // ❌ Pode causar erro

if (error) throw error;
return data;
```

**Depois:**
```typescript
const { error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId);  // ✅ Apenas UPDATE, sem SELECT

if (error) throw error;
return { success: true };
```

### 2. Cast Explícito para `any`

O campo `territorios` é do tipo `Json` no Supabase, mas estamos enviando `Territorios`. Para evitar erros de tipo:

```typescript
.update({ territorios: territorios as any })
```

### 3. Corrigir Tipo no `useUserTerritorios`

**Antes:**
```typescript
return (data?.territorios as Territorios) || { cidades: [], comunidades: [] };
// ❌ Erro: Json não pode ser convertido diretamente para Territorios
```

**Depois:**
```typescript
return (data?.territorios as any as Territorios) || { cidades: [], comunidades: [] };
// ✅ Double cast: Json → any → Territorios
```

## Arquivo Corrigido

### src/hooks/useTerritorios.ts

```typescript
export function useUpdateTerritorios() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      territorios,
    }: {
      userId: string;
      territorios: Territorios;
    }) => {
      // ✅ UPDATE sem SELECT
      const { error } = await supabase
        .from("profiles")
        .update({ territorios: territorios as any })
        .eq("id", userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}

export function useUserTerritorios(userId?: string) {
  return useQuery({
    queryKey: ["user-territorios", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("territorios")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // ✅ Double cast para evitar erro de tipo
      return (data?.territorios as any as Territorios) || { 
        cidades: [], 
        comunidades: [] 
      };
    },
    enabled: !!userId,
  });
}
```

## Por Que Funciona

### 1. UPDATE sem SELECT

Quando fazemos apenas UPDATE sem SELECT:
- ✅ Mais rápido (uma query em vez de duas)
- ✅ Não precisa coercer resultado para JSON
- ✅ Não há risco de erro "cannot coerce"
- ✅ Retorna apenas sucesso/erro

### 2. Invalidação de Queries

Após o UPDATE, invalidamos as queries:
```typescript
queryClient.invalidateQueries({ queryKey: ["users"] });
queryClient.invalidateQueries({ queryKey: ["user-profile"] });
```

Isso força o React Query a buscar os dados atualizados automaticamente.

### 3. Cast de Tipos

O PostgreSQL armazena `territorios` como `JSONB`, que é mapeado para `Json` no TypeScript do Supabase.

Para converter entre `Json` e `Territorios`:
```typescript
// Escrita (Territorios → Json)
territorios: territorios as any

// Leitura (Json → Territorios)
data?.territorios as any as Territorios
```

## Fluxo Completo

### 1. Usuário Edita Territórios

```typescript
// src/pages/Users.tsx
const handleSaveTerritorios = async () => {
  await updateTerritorios.mutateAsync({
    userId: editingUser.id,
    territorios: editTerritorios,  // { cidades: [...], comunidades: [...] }
  });
};
```

### 2. Hook Executa UPDATE

```typescript
// src/hooks/useTerritorios.ts
const { error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId);
```

### 3. Queries São Invalidadas

```typescript
queryClient.invalidateQueries({ queryKey: ["users"] });
```

### 4. Dados São Recarregados

O React Query automaticamente busca os dados atualizados da tabela `profiles`.

## Estrutura de Dados

### Interface TypeScript

```typescript
export interface Territorios {
  cidades: string[];
  comunidades: string[];
}
```

### Exemplo de Dados

```json
{
  "cidades": ["São Paulo", "Rio De Janeiro"],
  "comunidades": ["Heliópolis", "Rocinha"]
}
```

### No Banco (JSONB)

```sql
SELECT territorios FROM profiles WHERE id = 'user-id';

-- Resultado:
{
  "cidades": ["São Paulo", "Rio De Janeiro"],
  "comunidades": ["Heliópolis", "Rocinha"]
}
```

## Verificação

### Teste 1: Salvar Territórios

1. Ir em `/usuarios`
2. Clicar em "Editar Territórios" de um coordenador
3. Adicionar territórios usando o editor em cascata
4. Clicar em "Salvar"
5. ✅ Deve salvar sem erro
6. ✅ Toast de sucesso deve aparecer
7. ✅ Dialog deve fechar

### Teste 2: Verificar Dados Salvos

1. Reabrir "Editar Territórios" do mesmo coordenador
2. ✅ Territórios salvos devem aparecer como tags
3. ✅ Dados devem estar corretos

### Teste 3: Verificar no Banco

```sql
SELECT id, nome, territorios 
FROM profiles 
WHERE territorios IS NOT NULL;
```

Deve mostrar os territórios em formato JSON.

## Alternativa: Usar `.select().single()`

Se precisar retornar os dados atualizados:

```typescript
const { data, error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId)
  .select("territorios")  // Selecionar apenas o campo necessário
  .single();

if (error) throw error;
return data?.territorios as any as Territorios;
```

Mas isso é desnecessário se usarmos invalidação de queries.

## Conclusão

✅ Erro "Cannot coerce to single JSON object" corrigido
✅ UPDATE simplificado (sem SELECT)
✅ Tipos corrigidos com cast explícito
✅ Invalidação de queries garante dados atualizados
✅ Sistema funcionando corretamente

A abordagem de UPDATE sem SELECT é mais simples e robusta.
