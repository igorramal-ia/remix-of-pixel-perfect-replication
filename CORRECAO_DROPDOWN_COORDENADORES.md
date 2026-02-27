# Correção: Dropdown de Coordenadores Vazio

## Problema
O dropdown "Selecione um coordenador" no modal de nova campanha estava vazio mesmo com coordenadores cadastrados no sistema.

## Causa
O hook `useCoordenadores()` estava buscando apenas `id, nome` dos profiles, mas não incluía o campo `territorios`. Além disso, não estava ordenando os resultados.

## Solução Aplicada

### Hook useCoordenadores Corrigido

**Antes:**
```typescript
const { data: profilesData, error: profilesError } = await supabase
  .from("profiles")
  .select("id, nome");  // ❌ Faltava territorios e order
```

**Depois:**
```typescript
const { data: profilesData, error: profilesError } = await supabase
  .from("profiles")
  .select("id, nome, territorios")  // ✅ Incluído territorios
  .order("nome");  // ✅ Ordenado alfabeticamente
```

### Retorno do Hook

**Antes:**
```typescript
return coordenadores?.map((profile: any) => ({
  id: profile.id,
  nome: profile.nome,
  // ❌ Faltava territorios
})) || [];
```

**Depois:**
```typescript
return coordenadores?.map((profile: any) => ({
  id: profile.id,
  nome: profile.nome,
  territorios: profile.territorios || { cidades: [], comunidades: [] },  // ✅ Incluído
})) || [];
```

## Estrutura da Query

### 1. Buscar Profiles
```typescript
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, nome, territorios")
  .order("nome");
```

Busca TODOS os profiles ordenados por nome.

### 2. Buscar Roles de Coordenadores
```typescript
const { data: rolesData } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .eq("role", "coordenador");
```

Busca apenas os registros onde `role = 'coordenador'`.

### 3. Filtrar e Fazer Merge
```typescript
const coordenadores = profilesData?.filter((profile: any) =>
  rolesData?.some((role: any) => role.user_id === profile.id)
);
```

Filtra apenas os profiles que têm role de coordenador.

## Por Que Duas Queries?

O campo `role` está na tabela `user_roles`, não em `profiles`. O Supabase não reconhece automaticamente o relacionamento entre essas tabelas, então fazemos:

1. Query 1: Buscar todos os profiles
2. Query 2: Buscar roles de coordenadores
3. Merge: Filtrar profiles que são coordenadores

## Uso no Componente

```typescript
// src/components/NovaCampanhaModalV2.tsx
const { data: coordenadores } = useCoordenadores();

// No dropdown
<select>
  <option value="">Selecione um coordenador</option>
  {coordenadores?.map((c) => (
    <option key={c.id} value={c.id}>
      {c.nome}
    </option>
  ))}
</select>
```

## Dados Retornados

```typescript
interface Coordenador {
  id: string;
  nome: string;
  territorios: {
    cidades: string[];
    comunidades: string[];
  };
}
```

Exemplo:
```json
[
  {
    "id": "abc-123",
    "nome": "João Silva",
    "territorios": {
      "cidades": ["São Paulo"],
      "comunidades": ["Heliópolis", "Paraisópolis"]
    }
  },
  {
    "id": "def-456",
    "nome": "Maria Santos",
    "territorios": {
      "cidades": ["Rio De Janeiro"],
      "comunidades": []
    }
  }
]
```

## Diferença: Dropdown vs IA

### Dropdown Manual
- Mostra TODOS os coordenadores cadastrados
- Não filtra por território
- Admin escolhe manualmente

### Sugestão da IA
- Analisa territórios dos coordenadores
- Sugere o melhor match para a região
- Filtra automaticamente

## Como Testar

1. Ir para página de Campanhas
2. Clicar em "Nova Campanha"
3. Preencher Etapa 1 (nome, cliente, datas)
4. Na Etapa 2, adicionar um grupo
5. Verificar dropdown "Selecione um coordenador"
6. Deve mostrar lista de coordenadores ordenada alfabeticamente

## Verificação no Banco

```sql
-- Ver todos os coordenadores
SELECT 
  p.id,
  p.nome,
  p.territorios,
  ur.role
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.nome;
```

## Possíveis Problemas

### Dropdown ainda vazio após correção

**Causa 1**: Não há coordenadores cadastrados
```sql
-- Verificar
SELECT COUNT(*) FROM user_roles WHERE role = 'coordenador';
```

**Causa 2**: Cache do React Query
```typescript
// Forçar reload
queryClient.invalidateQueries({ queryKey: ["coordenadores"] });
```

**Causa 3**: Erro na query
- Abrir console do navegador (F12)
- Verificar se há erro na aba Network ou Console

## Arquivos Modificados

- `src/hooks/useCampaignsData.ts`
  - Adicionado campo `territorios` no SELECT
  - Adicionado `.order("nome")`
  - Incluído `territorios` no retorno do map

## Status

✅ Campo territorios incluído na query
✅ Ordenação alfabética adicionada
✅ Territorios incluído no retorno
✅ Dropdown deve funcionar corretamente
