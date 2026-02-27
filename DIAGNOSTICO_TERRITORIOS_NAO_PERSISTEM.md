# Diagnóstico: UPDATE retorna sucesso mas dados voltam vazios

## Problema
O UPDATE de territórios retorna sucesso, mas ao recarregar os dados voltam vazios.

## Verificações Realizadas

### ✅ 1. Campo territorios está no SELECT
```typescript
// src/pages/Users.tsx - fetchUsers()
const { data, error } = await supabase
  .from("profiles")
  .select("id, email, nome, criado_em, territorios")  // ✅ territorios incluído
```

### ✅ 2. Tipo TypeScript está correto
```typescript
// src/integrations/supabase/types.ts
profiles: {
  Row: {
    territorios: Json | null  // ✅ Campo existe
  }
  Update: {
    territorios?: Json | null  // ✅ Pode ser atualizado
  }
}
```

### ✅ 3. UPDATE usa .select() para retornar dados
```typescript
// src/hooks/useTerritorios.ts
const { data, error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId)
  .select("id, nome, territorios");  // ✅ Retorna dados atualizados
```

## Possíveis Causas

### Causa 1: RLS Policy bloqueando UPDATE
**Sintoma**: UPDATE retorna sucesso mas não persiste no banco

**Como verificar**:
```sql
-- Ver policies da tabela profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Solução**: Ajustar policy para permitir UPDATE do campo territorios

### Causa 2: Trigger revertendo mudanças
**Sintoma**: UPDATE funciona mas trigger desfaz a mudança

**Como verificar**:
```sql
-- Ver triggers da tabela profiles
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
```

**Solução**: Desabilitar ou ajustar trigger problemático

### Causa 3: Tipo da coluna incorreto
**Sintoma**: Dados são salvos como string em vez de JSONB

**Como verificar**:
```sql
-- Ver tipo da coluna
SELECT 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'territorios';
```

**Resultado esperado**: `data_type = 'jsonb'` ou `data_type = 'json'`

**Solução**: Alterar tipo da coluna se necessário

### Causa 4: Cache do Supabase
**Sintoma**: Dados estão no banco mas não aparecem na query

**Como verificar**: Rodar query diretamente no SQL Editor

**Solução**: Aguardar alguns segundos ou forçar refresh

## Testes a Realizar

### Teste 1: Verificar estrutura da tabela
```sql
-- Rodar no SQL Editor do Supabase
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### Teste 2: Verificar dados atuais
```sql
-- Ver todos os usuários e seus territórios
SELECT 
  id,
  nome,
  email,
  territorios,
  pg_typeof(territorios) as tipo
FROM profiles
ORDER BY criado_em DESC;
```

### Teste 3: Testar UPDATE manual
```sql
-- SUBSTITUIR [user_id] pelo ID real do coordenador
UPDATE profiles 
SET territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
WHERE email = 'coordenador@df.com'
RETURNING id, nome, territorios;

-- Verificar se persistiu
SELECT id, nome, territorios 
FROM profiles 
WHERE email = 'coordenador@df.com';
```

### Teste 4: Verificar logs do app
1. Abrir console do navegador (F12)
2. Editar territórios de um coordenador
3. Clicar em "Salvar"
4. Verificar logs:

```
🔵 [ANTES DO UPDATE]
  userId: "abc-123"
  territorios: { cidades: ["São Paulo"], comunidades: ["Heliópolis"] }

🟢 [DEPOIS DO UPDATE]
  data: [{ id: "abc-123", nome: "João", territorios: {...} }]
  error: null

✅ [UPDATE SUCESSO - DADOS RETORNADOS]
  territorios salvos: { cidades: ["São Paulo"], comunidades: ["Heliópolis"] }

🔄 [INVALIDANDO QUERIES]

📥 [BUSCANDO USUÁRIOS]
📊 [PROFILES DO BANCO]: [{ id: "abc-123", territorios: null }]  ⚠️ VAZIO!
```

## Logs Adicionados

### Hook useUpdateTerritorios
```typescript
console.log("🟢 [DEPOIS DO UPDATE]");
console.log("  data:", data);
console.log("  data stringified:", JSON.stringify(data));  // ✅ NOVO
console.log("  error:", error);

if (data && data.length > 0) {
  console.log("✅ [UPDATE SUCESSO - DADOS RETORNADOS]");  // ✅ NOVO
  console.log("  territorios salvos:", data[0].territorios);  // ✅ NOVO
} else {
  console.warn("⚠️ [UPDATE RETORNOU VAZIO]");  // ✅ NOVO
}
```

## Próximos Passos

### Passo 1: Executar script SQL
Rodar `verificar-territorios-banco.sql` no SQL Editor do Supabase

### Passo 2: Coletar logs do app
1. Editar territórios
2. Salvar
3. Copiar TODOS os logs do console

### Passo 3: Comparar resultados
- Se UPDATE retorna dados mas fetchUsers retorna vazio → Problema de cache ou RLS
- Se UPDATE retorna vazio → Problema de permissão
- Se dados estão no banco mas não aparecem → Problema de query ou tipo

### Passo 4: Aplicar correção específica
Baseado nos resultados dos testes acima

## Arquivos para Análise

1. `verificar-territorios-banco.sql` - Script SQL completo
2. Logs do console do navegador
3. Resultado das queries SQL

## Checklist de Verificação

- [ ] Executar `verificar-territorios-banco.sql`
- [ ] Verificar tipo da coluna territorios (deve ser jsonb)
- [ ] Verificar RLS policies
- [ ] Verificar triggers
- [ ] Testar UPDATE manual no SQL Editor
- [ ] Coletar logs completos do app
- [ ] Comparar dados retornados pelo UPDATE vs fetchUsers
