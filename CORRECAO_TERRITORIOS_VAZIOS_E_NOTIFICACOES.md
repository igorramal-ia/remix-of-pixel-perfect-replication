# Correção: Territórios vazios e função de notificações

## Problema 1: Territórios salvam vazios

### Causa
O componente `TerritoriosEditor` estava notificando mudanças através do `useEffect` que roda na inicialização, enviando arrays vazios antes dos territórios serem carregados.

### Solução Aplicada

#### A. Logs adicionados no TerritoriosEditor
```typescript
// src/components/TerritoriosEditor.tsx
console.log("🔄 [TerritoriosEditor] Notificando mudança:");
console.log("  territorios internos:", territorios);
console.log("  cidades extraídas:", cidades);
console.log("  comunidades extraídas:", comunidades);
```

#### B. Logs adicionados no handleSaveTerritorios
```typescript
// src/pages/Users.tsx
console.log("💾 [CLIQUE EM SALVAR]");
console.log("  editingUser:", editingUser);
console.log("  editTerritorios (estado local):", editTerritorios);
console.log("  editTerritorios stringified:", JSON.stringify(editTerritorios));
```

### Como Testar

1. Abrir console do navegador (F12)
2. Ir para página de Usuários
3. Clicar em "Editar" em um coordenador
4. Adicionar territórios:
   - Selecionar UF: "SP"
   - Selecionar Cidade: "São Paulo"
   - Selecionar Comunidade: "Heliópolis"
   - Clicar em "Adicionar Território"
5. Verificar no console:
   ```
   🔄 [TerritoriosEditor] Notificando mudança:
     territorios internos: [{ id: "...", uf: "SP", cidade: "São Paulo", ... }]
     cidades extraídas: []
     comunidades extraídas: ["Heliópolis"]
   ```
6. Clicar em "Salvar"
7. Verificar no console:
   ```
   💾 [CLIQUE EM SALVAR]
     editTerritorios (estado local): { cidades: [], comunidades: ["Heliópolis"] }
   ```

### Diagnóstico Esperado

Os logs vão revelar:
- Se `territorios` internos estão sendo populados corretamente
- Se a extração de cidades/comunidades está funcionando
- Se o estado `editTerritorios` está recebendo os valores corretos
- Se há algum problema na conversão do formato interno para o formato antigo

---

## Problema 2: Função contar_notificacoes_nao_lidas retorna 404

### Causa
A função SQL estava definida sem parâmetro `user_id`, mas o hook estava tentando chamá-la (sem passar parâmetro também).

### Solução Aplicada

#### A. Migration criada
```sql
-- supabase/migrations/20260225210000_fix_contar_notificacoes_function.sql

DROP FUNCTION IF EXISTS contar_notificacoes_nao_lidas();

CREATE OR REPLACE FUNCTION contar_notificacoes_nao_lidas(p_user_id UUID) 
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM notificacoes 
  WHERE notificacoes.user_id = p_user_id AND lida = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

#### B. Hook corrigido
```typescript
// src/hooks/useNotificacoes.ts

const { data, error } = await supabase.rpc("contar_notificacoes_nao_lidas", {
  p_user_id: user.id,  // ✅ Agora passa o user_id
});
```

### Como Aplicar

1. Rodar a migration:
```bash
npx supabase db push
```

2. Verificar se a função foi criada:
```sql
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'contar_notificacoes_nao_lidas';
```

3. Testar manualmente:
```sql
SELECT contar_notificacoes_nao_lidas('[user_id]'::uuid);
```

### Como Testar no App

1. Fazer login no sistema
2. Verificar se o sino de notificações aparece no header
3. Verificar no console se há erro 404
4. Se houver notificações não lidas, o número deve aparecer no badge vermelho

---

## Arquivos Modificados

### Problema 1 (Territórios vazios)
1. `src/components/TerritoriosEditor.tsx` - Adicionados logs no useEffect
2. `src/pages/Users.tsx` - Adicionados logs no handleSaveTerritorios

### Problema 2 (Notificações)
1. `supabase/migrations/20260225210000_fix_contar_notificacoes_function.sql` - Nova migration
2. `src/hooks/useNotificacoes.ts` - Corrigida chamada RPC com parâmetro

---

## Próximos Passos

### Para Territórios Vazios:
1. Executar teste e coletar logs do console
2. Verificar se `territorios` internos estão sendo populados
3. Verificar se a conversão para formato antigo está correta
4. Se necessário, ajustar a lógica de conversão ou o useEffect

### Para Notificações:
1. Aplicar migration: `npx supabase db push`
2. Testar no app se o sino funciona sem erro 404
3. Criar notificação de teste para verificar contagem

---

## Possíveis Problemas Adicionais

### Territórios ainda salvam vazios após logs:

**Cenário 1**: `territorios` internos estão vazios
```
territorios internos: []
```
**Causa**: Estado não está sendo atualizado ao adicionar território
**Solução**: Verificar `handleAdicionarTerritorio()`

**Cenário 2**: Extração retorna vazios mesmo com territorios
```
territorios internos: [{ tipo: "comunidade_especifica", ... }]
cidades extraídas: []
comunidades extraídas: []
```
**Causa**: Filtro ou map está falhando
**Solução**: Verificar lógica de filtro e map

**Cenário 3**: Estado local não atualiza
```
💾 [CLIQUE EM SALVAR]
  editTerritorios: { cidades: [], comunidades: [] }
```
**Causa**: `onChange` não está atualizando `editTerritorios`
**Solução**: Verificar se `setEditTerritorios` está sendo chamado

### Notificações ainda retornam 404:

**Causa**: Migration não foi aplicada
**Solução**: Rodar `npx supabase db push` novamente

**Causa**: Nome do parâmetro diferente
**Solução**: Verificar se o nome do parâmetro na função SQL (`p_user_id`) corresponde ao nome passado no RPC
