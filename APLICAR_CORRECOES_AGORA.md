# Aplicar Correções - Territórios e Notificações

## 🎯 Resumo das Correções

### 1. Territórios salvam vazios
- ✅ Logs adicionados no `TerritoriosEditor.tsx`
- ✅ Logs adicionados no `Users.tsx` (handleSaveTerritorios)
- 🔍 Aguardando teste para diagnosticar problema

### 2. Função de notificações retorna 404
- ✅ Migration criada: `20260225210000_fix_contar_notificacoes_function.sql`
- ✅ Hook corrigido: `useNotificacoes.ts` agora passa `p_user_id`
- ⚠️ Precisa aplicar migration

---

## 📋 Passo a Passo

### Etapa 1: Aplicar Migration de Notificações

```bash
npx supabase db push
```

**Saída esperada:**
```
Applying migration 20260225210000_fix_contar_notificacoes_function.sql...
Migration applied successfully
```

### Etapa 2: Verificar Função no Banco

Abrir SQL Editor do Supabase e executar:

```sql
-- Verificar se a função existe
SELECT routine_name, data_type 
FROM information_schema.routines 
WHERE routine_name = 'contar_notificacoes_nao_lidas';
```

**Resultado esperado:**
```
routine_name                      | data_type
----------------------------------|----------
contar_notificacoes_nao_lidas    | integer
```

### Etapa 3: Testar Notificações no App

1. Fazer login no sistema
2. Verificar se o sino aparece no header (canto superior direito)
3. Abrir console do navegador (F12)
4. Verificar se NÃO há erro 404 relacionado a `contar_notificacoes_nao_lidas`
5. Se houver notificações não lidas, o badge vermelho deve aparecer com o número

### Etapa 4: Testar Territórios

1. Abrir console do navegador (F12)
2. Ir para página de Usuários
3. Clicar em "Editar" (ícone de lápis) em um coordenador
4. Adicionar território:
   - Selecionar UF: "SP"
   - Selecionar Cidade: "São Paulo"
   - Selecionar Comunidade: "Heliópolis"
   - Clicar em "Adicionar Território"
5. Verificar logs no console:
   ```
   🔄 [TerritoriosEditor] Notificando mudança:
     territorios internos: [...]
     cidades extraídas: [...]
     comunidades extraídas: [...]
   ```
6. Clicar em "Salvar"
7. Verificar logs no console:
   ```
   💾 [CLIQUE EM SALVAR]
     editTerritorios: { cidades: [...], comunidades: [...] }
   
   🔵 [ANTES DO UPDATE]
     userId: "..."
     territorios: { cidades: [...], comunidades: [...] }
   
   🟢 [DEPOIS DO UPDATE]
     data: [...]
     error: null
   ```

### Etapa 5: Enviar Logs

Se territórios ainda salvarem vazios, copiar e enviar os logs do console mostrando:
- 🔄 Logs do TerritoriosEditor
- 💾 Logs do clique em Salvar
- 🔵 Logs antes do UPDATE
- 🟢 Logs depois do UPDATE

---

## 🔍 Diagnóstico Rápido

### Notificações funcionando?
✅ Sino aparece sem erro 404
✅ Badge vermelho mostra número correto
❌ Erro 404 no console → Migration não foi aplicada

### Territórios funcionando?
✅ Logs mostram territorios não vazios
✅ UPDATE retorna data sem error
✅ Badges aparecem na listagem após salvar
❌ Arrays vazios nos logs → Problema no TerritoriosEditor
❌ Error no UPDATE → Problema de permissão ou tipo

---

## 📁 Arquivos Modificados

```
src/
├── components/
│   └── TerritoriosEditor.tsx      ✅ Logs adicionados
├── pages/
│   └── Users.tsx                  ✅ Logs adicionados
└── hooks/
    ├── useTerritorios.ts          ✅ Logs adicionados
    └── useNotificacoes.ts         ✅ Parâmetro corrigido

supabase/migrations/
└── 20260225210000_fix_contar_notificacoes_function.sql  ⚠️ Aplicar
```

---

## 🚨 Se Algo Der Errado

### Migration falha ao aplicar:
```bash
# Ver status das migrations
npx supabase migration list

# Forçar reset (CUIDADO: apaga dados)
npx supabase db reset
```

### Função ainda retorna 404:
1. Verificar se migration foi aplicada
2. Verificar nome do parâmetro: `p_user_id`
3. Aplicar manualmente no SQL Editor:
```sql
CREATE OR REPLACE FUNCTION contar_notificacoes_nao_lidas(p_user_id UUID) 
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM notificacoes 
  WHERE notificacoes.user_id = p_user_id AND lida = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### Territórios ainda salvam vazios:
1. Coletar logs completos do console
2. Verificar se `handleAdicionarTerritorio()` está funcionando
3. Verificar se `onChange` está sendo chamado
4. Enviar logs para análise detalhada

---

## ✅ Checklist Final

- [ ] Migration aplicada com sucesso
- [ ] Função existe no banco
- [ ] Sino de notificações funciona sem erro 404
- [ ] Logs de territórios aparecem no console
- [ ] Territórios salvam corretamente (ou logs coletados para análise)
