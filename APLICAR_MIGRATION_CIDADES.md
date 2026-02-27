# Como Aplicar a Migration de Cidades Cobertura

## Problema
A tabela `cidades_cobertura` ainda não existe no banco de dados Supabase.

## Solução

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/ompimrxcmajdxwpahbub
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Cole o SQL abaixo:

```sql
-- Criar tabela cidades_cobertura
CREATE TABLE IF NOT EXISTS public.cidades_cobertura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT NOT NULL,
  cidade TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cidades_cobertura_uf_cidade_unique UNIQUE (uf, cidade)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cidades_cobertura_uf ON public.cidades_cobertura(uf);
CREATE INDEX IF NOT EXISTS idx_cidades_cobertura_cidade ON public.cidades_cobertura(cidade);

-- Enable RLS
ALTER TABLE public.cidades_cobertura ENABLE ROW LEVEL SECURITY;

-- Drop policies se existirem
DROP POLICY IF EXISTS "Everyone can view cidades_cobertura" ON public.cidades_cobertura;
DROP POLICY IF EXISTS "Admins can insert cidades_cobertura" ON public.cidades_cobertura;
DROP POLICY IF EXISTS "Operacoes can insert cidades_cobertura" ON public.cidades_cobertura;

-- Criar policies
CREATE POLICY "Everyone can view cidades_cobertura" ON public.cidades_cobertura
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert cidades_cobertura" ON public.cidades_cobertura
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can insert cidades_cobertura" ON public.cidades_cobertura
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'operacoes'));

-- Popular com cidades já existentes
INSERT INTO public.cidades_cobertura (uf, cidade)
SELECT DISTINCT uf, cidade
FROM public.enderecos
ON CONFLICT (uf, cidade) DO NOTHING;
```

5. Clique em **Run** ou pressione `Ctrl+Enter`
6. Verifique se a mensagem de sucesso aparece

### Opção 2: Via Supabase CLI (Se instalado)

```bash
# Aplicar todas as migrations pendentes
npx supabase db push

# Ou aplicar migration específica
npx supabase migration up
```

### Opção 3: Via arquivo SQL direto

O arquivo já está criado em:
```
supabase/migrations/20260225180000_add_cidades_cobertura.sql
```

Você pode copiar o conteúdo e executar no SQL Editor.

## Após Aplicar a Migration

### 1. Atualizar os tipos TypeScript

Execute o comando para regenerar os tipos:
```bash
npx supabase gen types typescript --project-id ompimrxcmajdxwpahbub > src/integrations/supabase/types.ts
```

Ou manualmente, a tabela já está adicionada em `src/integrations/supabase/types.ts`.

### 2. Atualizar o hook useRegioes.ts

Depois que a tabela existir, atualize a função `useAdicionarCidade` para salvar no banco:

```typescript
export function useAdicionarCidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uf, cidade }: { uf: string; cidade: string }) => {
      const { data, error } = await supabase
        .from("cidades_cobertura")
        .insert({ uf, cidade })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cidades", variables.uf] });
    },
  });
}
```

## Verificar se Funcionou

1. Abra o Supabase Dashboard
2. Vá em **Table Editor**
3. Procure pela tabela `cidades_cobertura`
4. Deve ter registros populados com cidades de `enderecos`

## Status Atual

✅ Migration criada: `supabase/migrations/20260225180000_add_cidades_cobertura.sql`
✅ Tipos TypeScript atualizados: `src/integrations/supabase/types.ts`
✅ Hook funciona sem a tabela (modo fallback)
⏳ Aguardando aplicação da migration no banco

## Funcionalidade Atual (Sem a Tabela)

O sistema funciona normalmente:
- Select de UF: ✅ Funciona (lista fixa)
- Select de Cidade: ✅ Funciona (busca de `enderecos`)
- Select de Comunidade: ✅ Funciona (busca de `enderecos`)
- Adicionar nova cidade: ⚠️ Funciona mas não salva no banco (apenas usa no grupo)

Após aplicar a migration, a funcionalidade "Adicionar nova cidade" salvará permanentemente no banco.
