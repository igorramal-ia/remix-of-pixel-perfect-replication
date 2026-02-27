# Correções na Seleção em Cascata de Regiões

## Problemas Identificados

### 1. Select de Cidade Vazio ❌
**Problema:** O select de cidades estava vazio mesmo com cidades cadastradas no banco.

**Causa:** A query estava tentando buscar de `cidades_cobertura` que não existe ainda.

**Solução:** ✅ Atualizado `useCidadesPorUF()` para buscar APENAS de `enderecos`:
```typescript
const { data, error } = await supabase
  .from("enderecos")
  .select("cidade")
  .eq("uf", uf);

// Remover duplicatas e ordenar
const cidadesSet = new Set<string>();
data?.forEach((e: any) => cidadesSet.add(e.cidade));
return Array.from(cidadesSet).sort();
```

### 2. Tabela cidades_cobertura Não Existe ❌
**Problema:** A tabela `cidades_cobertura` não foi criada no banco ainda.

**Causa:** Migration criada mas não aplicada.

**Solução:** ✅ Criado guia de aplicação em `APLICAR_MIGRATION_CIDADES.md`

**Solução Temporária:** ✅ Hook `useAdicionarCidade()` funciona sem a tabela:
```typescript
mutationFn: async ({ uf, cidade }: { uf: string; cidade: string }) => {
  // Retorna sucesso - a cidade será usada diretamente no grupo
  return { uf, cidade, id: crypto.randomUUID(), criado_em: new Date().toISOString() };
}
```

## Status Atual

### ✅ Funcionando Agora

1. **Select UF**
   - Lista fixa de 27 estados brasileiros
   - Funciona perfeitamente

2. **Select Cidade**
   - Busca cidades únicas de `enderecos` filtradas por UF
   - Query: `SELECT DISTINCT cidade FROM enderecos WHERE uf = 'SP' ORDER BY cidade`
   - Remove duplicatas e ordena alfabeticamente
   - ✅ **CORRIGIDO**

3. **Select Comunidade**
   - Busca comunidades únicas filtradas por cidade
   - Opção "Cidade inteira" disponível
   - Funciona perfeitamente

4. **Adicionar Nova Cidade**
   - Mostra campo de texto quando selecionado
   - Cria grupo com a nova cidade
   - ⚠️ Não salva no banco (aguardando migration)
   - Mas funciona para criar a campanha

5. **Fluxo Completo**
   - UF → Cidade → Comunidade → Quantidade → Próxima Etapa
   - ✅ **FUNCIONANDO**

### ⏳ Aguardando Migration

Para funcionalidade completa de "Adicionar nova cidade":
1. Aplicar migration via SQL Editor do Supabase
2. Atualizar `useAdicionarCidade()` para salvar no banco
3. Cidades novas ficarão disponíveis para futuras campanhas

## Arquivos Modificados

### src/hooks/useRegioes.ts
```typescript
// ANTES (não funcionava)
export function useCidadesPorUF(uf: string | null) {
  // Buscava de enderecos + cidades_cobertura (não existe)
  const { data: cidadesData } = await supabase
    .from("cidades_cobertura")  // ❌ Tabela não existe
    .select("cidade")
    .eq("uf", uf);
}

// DEPOIS (funciona)
export function useCidadesPorUF(uf: string | null) {
  // Busca APENAS de enderecos
  const { data } = await supabase
    .from("enderecos")  // ✅ Tabela existe
    .select("cidade")
    .eq("uf", uf);
  
  // Remove duplicatas
  const cidadesSet = new Set<string>();
  data?.forEach((e: any) => cidadesSet.add(e.cidade));
  return Array.from(cidadesSet).sort();
}
```

### useAdicionarCidade()
```typescript
// Modo fallback (funciona sem a tabela)
mutationFn: async ({ uf, cidade }) => {
  return { 
    uf, 
    cidade, 
    id: crypto.randomUUID(), 
    criado_em: new Date().toISOString() 
  };
}
```

## Como Testar

### 1. Testar Select de Cidades
```
1. Abrir modal "Nova Campanha"
2. Preencher Etapa 1 (dados básicos)
3. Clicar "Próxima"
4. Selecionar UF: "SP"
5. Verificar que o select de Cidade carrega cidades de São Paulo
6. ✅ Deve mostrar cidades como: São Paulo, Guarulhos, Campinas, etc.
```

### 2. Testar Fluxo Completo
```
1. Selecionar UF: "RJ"
2. Selecionar Cidade: "Rio de Janeiro"
3. Selecionar Comunidade: "Rocinha"
4. Digitar Quantidade: 10
5. Clicar "Adicionar Grupo"
6. Grupo aparece na lista
7. Clicar "Próxima"
8. ✅ Etapa 3 mostra resumo correto
```

### 3. Testar Adicionar Nova Cidade
```
1. Selecionar UF: "MG"
2. Selecionar Cidade: "Adicionar nova cidade"
3. Campo de texto aparece
4. Digitar: "Contagem"
5. Digitar Quantidade: 5
6. Clicar "Adicionar Grupo"
7. ✅ Grupo criado com "Contagem/MG"
8. ⚠️ Cidade não salva no banco (aguardando migration)
```

## Próximos Passos

### 1. Aplicar Migration (Urgente)
- Seguir instruções em `APLICAR_MIGRATION_CIDADES.md`
- Executar SQL no Supabase Dashboard
- Verificar que tabela foi criada

### 2. Atualizar Hook (Após Migration)
- Descomentar código de insert em `useAdicionarCidade()`
- Testar salvamento de novas cidades
- Verificar que cidades aparecem em futuras seleções

### 3. Testes Finais
- Criar campanha com cidade existente
- Criar campanha com cidade nova
- Criar campanha com "cidade inteira"
- Verificar notificações dos coordenadores

## Arquivos de Referência

- `src/hooks/useRegioes.ts` - Hook corrigido
- `src/components/NovaCampanhaModalV2.tsx` - Modal com selects
- `supabase/migrations/20260225180000_add_cidades_cobertura.sql` - Migration
- `APLICAR_MIGRATION_CIDADES.md` - Guia de aplicação
- `SELECAO_CASCATA_REGIOES.md` - Documentação completa

## Conclusão

✅ **Problema 1 RESOLVIDO:** Select de cidades agora carrega corretamente de `enderecos`

✅ **Problema 2 CONTORNADO:** Sistema funciona sem `cidades_cobertura` (modo fallback)

✅ **Fluxo Completo FUNCIONANDO:** UF → Cidade → Comunidade → Etapa 3

⏳ **Pendente:** Aplicar migration para funcionalidade completa de adicionar cidades

O sistema está pronto para uso! A única limitação é que cidades novas não são salvas permanentemente até a migration ser aplicada.
