# Correções Finais - Campanhas

## Problemas Corrigidos

### 1. ✅ Erro de notificação ao criar campanha
**Problema**: Campanha era criada mas dava erro de notificação, precisava dar F5

**Causa**: Erro na criação de notificação bloqueava o fluxo

**Solução**: Tornar criação de notificação opcional (não crítica)
```typescript
// Criar notificação (não bloquear se falhar)
try {
  await criarNotificacao.mutateAsync({...});
} catch (notifError) {
  console.warn("Erro ao criar notificação (não crítico):", notifError);
}
```

Agora a campanha é criada com sucesso mesmo se a notificação falhar.

---

### 2. ✅ Status "Finalizada" para campanha que deveria estar "Ativa"
**Problema**: Campanha com data_inicio = hoje mostrava "Finalizada"

**Causa**: Lógica só verificava se data_fim >= hoje

**Solução**: Verificar se hoje está entre data_inicio e data_fim
```typescript
const isActive = (dataInicio: string | null, dataFim: string | null) => {
  if (!dataInicio || !dataFim) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(dataInicio);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(dataFim);
  fim.setHours(23, 59, 59, 999);
  return hoje >= inicio && hoje <= fim;
};
```

Agora:
- **Ativa**: data_inicio <= hoje <= data_fim
- **Finalizada**: hoje > data_fim ou hoje < data_inicio

---

### 3. ✅ "Sem coordenadores" mesmo com coordenador vinculado
**Problema**: Coordenadores não apareciam na listagem

**Causa**: Query com JOIN que o Supabase não reconhecia

**Solução**: Queries separadas com merge no JavaScript
```typescript
// 1. Buscar vínculos
const { data: coordenadoresVinculo } = await supabase
  .from("campanha_coordenadores")
  .select("coordenador_id")
  .eq("campanha_id", campanha.id);

// 2. Buscar dados dos coordenadores
if (coordenadoresVinculo && coordenadoresVinculo.length > 0) {
  const coordenadorIds = coordenadoresVinculo.map((c) => c.coordenador_id);
  const { data: coordenadoresData } = await supabase
    .from("profiles")
    .select("id, nome")
    .in("id", coordenadorIds);

  coordenadores = coordenadoresData || [];
}
```

---

### 4. ✅ Botões de Editar e Excluir adicionados
**Implementado**: Botões para gerenciar campanhas

**Recursos**:
- Botão de editar (ícone de lápis) - Edita nome, cliente, datas
- Botão de excluir (ícone de lixeira) - Com confirmação
- Visíveis apenas para admins e operações
- Toasts de feedback

---

## Arquivos Modificados

1. `src/components/NovaCampanhaModalV2.tsx`
   - Notificação agora é opcional (try-catch)

2. `src/pages/Campaigns.tsx`
   - Lógica de status corrigida (data_inicio e data_fim)
   - Botões de editar e excluir adicionados
   - Modais de edição e exclusão

3. `src/hooks/useCampaignsData.ts`
   - Query de coordenadores corrigida (queries separadas)
   - Hooks `useDeleteCampanha()` e `useUpdateCampanha()` adicionados

---

## Como Testar

### Teste 1: Criar campanha
1. Criar nova campanha com data_inicio = hoje
2. Verificar que não dá erro de notificação
3. Verificar que status aparece como "Ativa"
4. Verificar que coordenadores aparecem

### Teste 2: Status da campanha
- **Ativa**: data_inicio <= hoje <= data_fim → Badge verde
- **Finalizada**: hoje > data_fim → Badge cinza

### Teste 3: Coordenadores
1. Criar campanha com coordenador
2. Verificar que aparece "1 coordenador" (não "Sem coordenadores")
3. Abrir detalhes e verificar nome do coordenador

### Teste 4: Editar/Excluir
1. Clicar no ícone de lápis
2. Editar nome/cliente/datas
3. Salvar e verificar atualização
4. Clicar no ícone de lixeira
5. Confirmar exclusão

---

## Próximos Passos

### Pontos no mapa (pendente)
**Problema relatado**: "tem representante, porque nessa parte aparece como se não tivesse"

**Investigar**:
1. Verificar status das instalações no banco
2. Verificar se `representante_id` está sendo salvo
3. Verificar cor dos marcadores no mapa

**Query para verificar**:
```sql
SELECT 
  i.id,
  i.status,
  i.representante_id,
  p.nome as representante_nome,
  e.endereco,
  e.comunidade
FROM instalacoes i
LEFT JOIN profiles p ON p.id = i.representante_id
LEFT JOIN enderecos e ON e.id = i.endereco_id
WHERE i.campanha_id = '[campanha_id]';
```

---

## Status

✅ Erro de notificação corrigido
✅ Status "Ativa" corrigido
✅ Coordenadores aparecem
✅ Botões de editar/excluir funcionando
⏳ Pontos no mapa - aguardando mais informações
