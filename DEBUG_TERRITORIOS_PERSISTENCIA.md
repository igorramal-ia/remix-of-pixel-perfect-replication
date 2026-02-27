# Debug: Territórios não persistem no banco

## Problema
Territórios não estão sendo salvos no banco de dados após clicar em "Salvar".

## Verificações Realizadas

### 1. ✅ Tipo TypeScript está correto
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

O campo `territorios` está corretamente definido como `Json | null` no tipo do Supabase.

### 2. 🔍 Logs adicionados para debug

#### A. Hook useUpdateTerritorios
```typescript
// src/hooks/useTerritorios.ts

console.log("🔵 [ANTES DO UPDATE]");
console.log("  userId:", userId);
console.log("  territorios:", territorios);
console.log("  territorios stringified:", JSON.stringify(territorios));

const { data, error } = await supabase
  .from("profiles")
  .update({ territorios: territorios as any })
  .eq("id", userId)
  .select();

console.log("🟢 [DEPOIS DO UPDATE]");
console.log("  data:", data);
console.log("  error:", error);
```

#### B. Função fetchUsers
```typescript
// src/pages/Users.tsx

console.log("📥 [BUSCANDO USUÁRIOS]");
console.log("📊 [PROFILES DO BANCO]:", profilesData);
console.log("✅ Territórios de ${user.nome}:", user.territorios);
console.log("📋 [USUÁRIOS FORMATADOS]:", formattedUsers);
```

## Como Testar

1. Abrir console do navegador (F12)
2. Ir para página de Usuários
3. Clicar em "Editar" em um coordenador
4. Adicionar territórios:
   - Selecionar UF: "SP"
   - Selecionar Cidade: "São Paulo"
   - Selecionar Comunidade: "Heliópolis"
5. Clicar em "Salvar"

## O que verificar no console

### Sequência esperada:

```
🔵 [ANTES DO UPDATE]
  userId: "abc-123-def"
  territorios: { cidades: ["São Paulo"], comunidades: ["Heliópolis"] }
  territorios stringified: {"cidades":["São Paulo"],"comunidades":["Heliópolis"]}

🟢 [DEPOIS DO UPDATE]
  data: [{ id: "abc-123-def", territorios: {...}, ... }]
  error: null

✅ [UPDATE SUCESSO]

🔄 [INVALIDANDO QUERIES]

📥 [BUSCANDO USUÁRIOS]
📊 [PROFILES DO BANCO]: [{ id: "abc-123-def", territorios: {...}, ... }]
✅ Territórios de João Silva: { cidades: ["São Paulo"], comunidades: ["Heliópolis"] }
📋 [USUÁRIOS FORMATADOS]: [...]
```

### Possíveis problemas:

#### Problema 1: Error não é null
```
🟢 [DEPOIS DO UPDATE]
  data: null
  error: { message: "...", code: "..." }
```
**Causa**: Erro de permissão ou constraint no banco
**Solução**: Verificar RLS policies da tabela profiles

#### Problema 2: Data retorna vazio
```
🟢 [DEPOIS DO UPDATE]
  data: []
  error: null
```
**Causa**: `.eq('id', userId)` não encontrou o registro
**Solução**: Verificar se userId está correto

#### Problema 3: Territorios vem null do banco
```
📊 [PROFILES DO BANCO]: [{ id: "abc-123-def", territorios: null, ... }]
⚠️ João Silva não tem territórios
```
**Causa**: UPDATE não persistiu no banco
**Solução**: Verificar RLS policies ou constraints

#### Problema 4: Territorios vem como string
```
✅ Territórios de João Silva: "{\"cidades\":[\"São Paulo\"]}"
```
**Causa**: Campo está como TEXT no banco em vez de JSONB
**Solução**: Verificar tipo da coluna no banco

## Verificações no Banco de Dados

### 1. Verificar tipo da coluna
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'territorios';
```

Deve retornar: `data_type = 'jsonb'`

### 2. Verificar RLS policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

Deve ter policy que permite UPDATE para administradores.

### 3. Verificar dados atuais
```sql
SELECT id, nome, territorios 
FROM profiles 
WHERE territorios IS NOT NULL;
```

### 4. Testar UPDATE manual
```sql
UPDATE profiles 
SET territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
WHERE id = '[user_id]';

-- Verificar
SELECT territorios FROM profiles WHERE id = '[user_id]';
```

## Arquivos Modificados

1. `src/hooks/useTerritorios.ts` - Adicionados logs detalhados no UPDATE
2. `src/pages/Users.tsx` - Adicionados logs na busca de usuários

## Próximos Passos

1. Executar o teste e coletar logs do console
2. Verificar qual dos problemas acima está ocorrendo
3. Se necessário, verificar RLS policies no banco
4. Se necessário, verificar tipo da coluna territorios
