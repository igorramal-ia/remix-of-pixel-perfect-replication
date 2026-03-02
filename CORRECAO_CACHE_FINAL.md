# ✅ Correção do Cache - RESOLVIDO

## 🐛 Problema
Após ativar/finalizar/substituir instalação na página de campanha, não atualizava automaticamente. Era necessário mudar de página ou dar F5.

## 🔍 Causa Raiz
Os hooks estavam invalidando a query key errada:
- ❌ Invalidavam: `["campaign-detail"]`
- ✅ Deveriam invalidar: `["campaign", id]`

A página `CampaignDetail` usa:
```typescript
const { data: campaign } = useCampaignDetail(id!);
```

Que internamente usa a query key:
```typescript
queryKey: ["campaign", id]
```

## 🔧 Correção Aplicada

Atualizei todos os hooks em `src/hooks/useInstalacoes.ts`:

### 1. useAtivarInstalacao
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["campaign"] }); // ✅ NOVO
  queryClient.invalidateQueries({ queryKey: ["campaigns"] }); // ✅ NOVO
  // ... outras queries
}
```

### 2. useFinalizarInstalacao
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["campaign"] }); // ✅ NOVO
  queryClient.invalidateQueries({ queryKey: ["campaigns"] }); // ✅ NOVO
  // ... outras queries
}
```

### 3. useSubstituirEndereco
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["campaign"] }); // ✅ NOVO
  queryClient.invalidateQueries({ queryKey: ["campaigns"] }); // ✅ NOVO
  // ... outras queries
}
```

## 📊 Queries Invalidadas

Agora cada mutação invalida:
1. ✅ `["campaign"]` - Todas as campanhas individuais (inclui `["campaign", id]`)
2. ✅ `["campaigns"]` - Lista de campanhas
3. ✅ `["instalacoes"]` - Instalações
4. ✅ `["enderecos"]` - Endereços
5. ✅ `["dashboard"]` - Dashboard
6. ✅ `["coordenador-dashboard"]` - Dashboard do coordenador
7. ✅ `["inventory"]` - Inventário
8. ✅ `["historico-mudancas"]` - Histórico (apenas substituir)

## 🧪 Como Testar

### Teste 1: Ativar Instalação
1. Abrir página de campanha
2. Clicar "Ativar" em uma instalação pendente
3. Preencher dados e confirmar
4. ✅ Verificar se status muda para "Ativa" IMEDIATAMENTE
5. ✅ Verificar se contador de "Instalados" atualiza
6. ✅ Verificar se progresso atualiza

### Teste 2: Finalizar Instalação
1. Abrir página de campanha
2. Clicar "Finalizar" em uma instalação ativa
3. Preencher dados e confirmar
4. ✅ Verificar se status muda para "Finalizada" IMEDIATAMENTE
5. ✅ Verificar se contador de "Instalados" diminui
6. ✅ Verificar se progresso atualiza

### Teste 3: Substituir Endereço
1. Abrir página de campanha
2. Clicar "Substituir" em uma instalação
3. Preencher motivo e selecionar novo endereço
4. Confirmar
5. ✅ Verificar se endereço antigo some ou muda status
6. ✅ Verificar se novo endereço aparece como "Pendente"
7. ✅ Verificar se total de pontos se mantém

### Teste 4: Adicionar Pontos
1. Abrir página de campanha
2. Clicar "Adicionar Pontos"
3. Selecionar endereços ou criar novo
4. Confirmar
5. ✅ Verificar se novos pontos aparecem IMEDIATAMENTE
6. ✅ Verificar se total de pontos atualiza

## 🎯 Resultado Esperado

Após qualquer ação:
- ✅ Atualização IMEDIATA (sem F5)
- ✅ Contadores atualizados
- ✅ Status corretos
- ✅ Progresso atualizado
- ✅ Mapa atualizado (se aplicável)

## 📝 Notas Técnicas

### Por que `["campaign"]` funciona?

React Query usa "prefix matching" para invalidação:
- `invalidateQueries({ queryKey: ["campaign"] })` invalida:
  - `["campaign", "123"]`
  - `["campaign", "456"]`
  - `["campaign", "789"]`
  - etc.

Isso garante que TODAS as páginas de campanha sejam atualizadas, não apenas a atual.

### Por que também invalidar `["campaigns"]`?

Para atualizar a lista de campanhas (página `/campanhas`), garantindo que:
- Contadores estejam corretos
- Progresso esteja atualizado
- Dados estejam sincronizados

## ✅ Status

- [x] Problema identificado
- [x] Causa raiz encontrada
- [x] Correção aplicada
- [x] Documentação criada
- [ ] Testes executados (aguardando usuário)

---

**Correção aplicada em**: 01/03/2026  
**Arquivo modificado**: `src/hooks/useInstalacoes.ts`  
**Status**: ✅ Pronto para testar

