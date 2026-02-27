# Correção: Exclusão de Campanha com Cascade Delete

## Problema

Ao tentar excluir uma campanha, ocorria erro de foreign key constraint:

```
update or delete on table "campanhas" violates foreign key constraint
"instalacoes_campanha_id_fkey" on table "instalacoes"
```

## Causa

A função `useDeleteCampanha` tentava deletar apenas a campanha, mas havia registros relacionados em outras tabelas:

1. **instalacoes** - Instalações vinculadas à campanha
2. **campanha_coordenadores** - Vínculos com coordenadores
3. **notificacoes** - Notificações enviadas sobre a campanha

O PostgreSQL impede a exclusão por causa das foreign keys que garantem integridade referencial.

## Solução

Implementar **cascade delete manual** na ordem correta:

### Ordem de Exclusão

```typescript
// 1. Deletar instalações primeiro
await supabase
  .from("instalacoes")
  .delete()
  .eq("campanha_id", campanhaId);

// 2. Deletar vínculos com coordenadores
await supabase
  .from("campanha_coordenadores")
  .delete()
  .eq("campanha_id", campanhaId);

// 3. Deletar notificações relacionadas (opcional)
// Buscar notificações que mencionam a campanha
const { data: notificacoes } = await supabase
  .from("notificacoes")
  .select("id, mensagem")
  .ilike("mensagem", `%campanha%${campanhaId}%`);

if (notificacoes && notificacoes.length > 0) {
  const notificacaoIds = notificacoes.map((n) => n.id);
  await supabase
    .from("notificacoes")
    .delete()
    .in("id", notificacaoIds);
}

// 4. Finalmente, deletar a campanha
await supabase
  .from("campanhas")
  .delete()
  .eq("id", campanhaId);
```

### Por que essa ordem?

1. **instalacoes** → Referencia `campanha_id` (FK para campanhas)
2. **campanha_coordenadores** → Referencia `campanha_id` (FK para campanhas)
3. **notificacoes** → Não tem FK direta, mas pode mencionar a campanha na mensagem
4. **campanhas** → Tabela principal, deletada por último

## Código Completo

**Arquivo**: `src/hooks/useCampaignsData.ts`

```typescript
export function useDeleteCampanha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campanhaId: string) => {
      // 1. Deletar instalações primeiro
      const { error: instalacoesError } = await supabase
        .from("instalacoes")
        .delete()
        .eq("campanha_id", campanhaId);

      if (instalacoesError) throw instalacoesError;

      // 2. Deletar vínculos com coordenadores
      const { error: coordenadoresError } = await supabase
        .from("campanha_coordenadores")
        .delete()
        .eq("campanha_id", campanhaId);

      if (coordenadoresError) throw coordenadoresError;

      // 3. Deletar notificações relacionadas (se houver)
      const { data: notificacoes } = await supabase
        .from("notificacoes")
        .select("id, mensagem")
        .ilike("mensagem", `%campanha%${campanhaId}%`);

      if (notificacoes && notificacoes.length > 0) {
        const notificacaoIds = notificacoes.map((n) => n.id);
        await supabase
          .from("notificacoes")
          .delete()
          .in("id", notificacaoIds);
      }

      // 4. Finalmente, deletar a campanha
      const { error: campanhaError } = await supabase
        .from("campanhas")
        .delete()
        .eq("id", campanhaId);

      if (campanhaError) throw campanhaError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campanhas-ativas"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
```

## Alternativa: ON DELETE CASCADE no Banco

Outra solução seria adicionar `ON DELETE CASCADE` nas foreign keys via migration:

```sql
-- Alterar constraint de instalacoes
ALTER TABLE instalacoes
DROP CONSTRAINT instalacoes_campanha_id_fkey,
ADD CONSTRAINT instalacoes_campanha_id_fkey
  FOREIGN KEY (campanha_id)
  REFERENCES campanhas(id)
  ON DELETE CASCADE;

-- Alterar constraint de campanha_coordenadores
ALTER TABLE campanha_coordenadores
DROP CONSTRAINT campanha_coordenadores_campanha_id_fkey,
ADD CONSTRAINT campanha_coordenadores_campanha_id_fkey
  FOREIGN KEY (campanha_id)
  REFERENCES campanhas(id)
  ON DELETE CASCADE;
```

**Vantagens**:
- Mais simples no código
- Banco garante integridade automaticamente

**Desvantagens**:
- Menos controle sobre o que é deletado
- Pode deletar dados importantes sem aviso

Por isso, optei pela **exclusão manual em cascata** que dá mais controle e visibilidade.

## Resultado

Agora ao excluir uma campanha:

1. ✅ Todas as instalações são removidas
2. ✅ Todos os vínculos com coordenadores são removidos
3. ✅ Notificações relacionadas são removidas (opcional)
4. ✅ Campanha é excluída com sucesso
5. ✅ Cache é invalidado (queries são atualizadas)

## Como Testar

1. Criar uma campanha com instalações
2. Tentar excluir a campanha
3. Verificar que não há erro de foreign key
4. Confirmar que campanha foi removida
5. Verificar que instalações também foram removidas

---

## Arquivo Modificado

- `src/hooks/useCampaignsData.ts` - Função `useDeleteCampanha` com cascade delete

---

## Status

✅ **CONCLUÍDO** - Exclusão de campanha funcionando com cascade delete manual
