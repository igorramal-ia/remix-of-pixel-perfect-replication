# Resumo: Correções de Territórios e Notificações

## ✅ Correções Aplicadas

### 1. Logs Detalhados Adicionados

#### TerritoriosEditor.tsx
```typescript
console.log("🔄 [TerritoriosEditor] Notificando mudança:");
console.log("  territorios internos:", territorios);
console.log("  cidades extraídas:", cidades);
console.log("  comunidades extraídas:", comunidades);
```

#### Users.tsx - handleSaveTerritorios
```typescript
console.log("💾 [CLIQUE EM SALVAR]");
console.log("  editingUser:", editingUser);
console.log("  editTerritorios (estado local):", editTerritorios);
console.log("  editTerritorios stringified:", JSON.stringify(editTerritorios));
```

#### useTerritorios.ts - useUpdateTerritorios
```typescript
console.log("🔵 [ANTES DO UPDATE]");
console.log("  userId:", userId);
console.log("  territorios:", territorios);

console.log("🟢 [DEPOIS DO UPDATE]");
console.log("  data:", data);
console.log("  data stringified:", JSON.stringify(data));
console.log("  error:", error);

if (data && data.length > 0) {
  console.log("✅ [UPDATE SUCESSO - DADOS RETORNADOS]");
  console.log("  territorios salvos:", data[0].territorios);
} else {
  console.warn("⚠️ [UPDATE RETORNOU VAZIO]");
}
```

#### Users.tsx - fetchUsers
```typescript
console.log("📥 [BUSCANDO USUÁRIOS]");
console.log("📊 [PROFILES DO BANCO]:", profilesData);
console.log("✅ Territórios de ${user.nome}:", user.territorios);
console.log("📋 [USUÁRIOS FORMATADOS]:", formattedUsers);
```

### 2. Função de Notificações Corrigida

#### Migration criada
```sql
-- supabase/migrations/20260225210000_fix_contar_notificacoes_function.sql
CREATE OR REPLACE FUNCTION contar_notificacoes_nao_lidas(p_user_id UUID) 
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM notificacoes 
  WHERE notificacoes.user_id = p_user_id AND lida = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

#### Hook corrigido
```typescript
// src/hooks/useNotificacoes.ts
const { data, error } = await supabase.rpc("contar_notificacoes_nao_lidas", {
  p_user_id: user.id,  // ✅ Agora passa o parâmetro
});
```

### 3. SELECT explícito no UPDATE
```typescript
// src/hooks/useTerritorios.ts
const { data, error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId)
  .select("id, nome, territorios");  // ✅ SELECT explícito
```

---

## 🔍 Verificações Realizadas

### ✅ Campo territorios no SELECT
```typescript
// src/pages/Users.tsx
.select("id, email, nome, criado_em, territorios")  // ✅ Incluído
```

### ✅ Tipo TypeScript correto
```typescript
// src/integrations/supabase/types.ts
profiles: {
  Row: { territorios: Json | null }
  Update: { territorios?: Json | null }
}
```

---

## 📋 Próximos Passos

### 1. Aplicar Migration de Notificações
```bash
npx supabase db push
```

### 2. Executar Diagnóstico de Territórios

Seguir o guia: `EXECUTAR_DIAGNOSTICO_TERRITORIOS.md`

**Resumo**:
1. Abrir SQL Editor do Supabase
2. Executar `verificar-territorios-banco.sql`
3. Testar UPDATE manual
4. Verificar RLS policies
5. Testar no app com console aberto
6. Coletar todos os logs
7. Enviar resultados

### 3. Analisar Resultados

Os logs vão revelar:
- Se territorios estão sendo salvos no banco
- Se RLS policies estão bloqueando
- Se há problema de tipo ou trigger
- Se o problema está no app ou no banco

---

## 📁 Arquivos Criados/Modificados

### Modificados
1. `src/components/TerritoriosEditor.tsx` - Logs adicionados
2. `src/pages/Users.tsx` - Logs adicionados
3. `src/hooks/useTerritorios.ts` - Logs e SELECT explícito
4. `src/hooks/useNotificacoes.ts` - Parâmetro corrigido

### Criados
1. `supabase/migrations/20260225210000_fix_contar_notificacoes_function.sql`
2. `verificar-territorios-banco.sql`
3. `test-notificacoes-function.sql`
4. `DIAGNOSTICO_TERRITORIOS_NAO_PERSISTEM.md`
5. `EXECUTAR_DIAGNOSTICO_TERRITORIOS.md`
6. `CORRECAO_TERRITORIOS_VAZIOS_E_NOTIFICACOES.md`
7. `APLICAR_CORRECOES_AGORA.md`

---

## 🎯 Status Atual

### ✅ Notificações
- Migration criada
- Hook corrigido
- Pronto para aplicar: `npx supabase db push`

### 🔍 Territórios
- Logs completos adicionados
- SELECT explícito no UPDATE
- Aguardando diagnóstico para identificar causa raiz

---

## 🚨 Possíveis Causas (Territórios)

1. **RLS Policy bloqueando UPDATE** - Mais provável
2. **Trigger revertendo mudanças** - Possível
3. **Tipo da coluna incorreto** - Improvável (tipo está correto)
4. **Cache do Supabase** - Improvável (timeout já adicionado)

O diagnóstico SQL vai confirmar qual é a causa.
