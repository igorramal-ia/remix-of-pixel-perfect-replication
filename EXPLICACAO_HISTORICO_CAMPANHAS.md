# Histórico de Campanhas - Como Funciona

## Resposta Rápida

✅ **SIM**, campanhas concluídas aparecem no painel e mantêm o histórico completo.

---

## Como Funciona Atualmente

### 1. Dashboard (Página Inicial)

**Hook**: `useCampanhasAtivas()`
**Filtro**: Mostra apenas campanhas com `data_fim >= hoje`

```typescript
const { data, error } = await supabase
  .from("campanhas")
  .select("*")
  .gte("data_fim", hoje)  // ← Filtra apenas ativas
  .order("data_inicio", { ascending: false });
```

**Resultado**: Dashboard mostra apenas campanhas ativas (não finalizadas)

---

### 2. Página de Campanhas (/campanhas)

**Hook**: `useCampaigns()`
**Filtro**: Mostra TODAS as campanhas (sem filtro de data)

```typescript
const { data: campanhas, error } = await supabase
  .from("campanhas")
  .select("*")
  .order("criado_em", { ascending: false });  // ← Sem filtro de data
```

**Badge de Status**: Calculado dinamicamente

```typescript
const isActive = (dataInicio: string | null, dataFim: string | null) => {
  if (!dataInicio || !dataFim) return false;
  const hoje = new Date();
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  return hoje >= inicio && hoje <= fim;
};

// No card da campanha:
{isActive(campaign.data_inicio, campaign.data_fim) ? "Ativa" : "Finalizada"}
```

**Resultado**: 
- Campanhas ativas: Badge verde "Ativa"
- Campanhas finalizadas: Badge cinza "Finalizada"
- Todas aparecem na listagem

---

## Exemplo Visual

### Dashboard
```
Campanhas Ativas: 2

📊 Campanha Verão 2026 (Coca-Cola)
    ████████░░ 80% (8 de 10 pontos)

📊 Campanha Natal 2025 (Ambev)
    ██████████ 100% (15 de 15 pontos)
```

### Página de Campanhas
```
3 campanhas cadastradas

┌─────────────────────────────────┐
│ Campanha Verão 2026             │ 🟢 Ativa
│ Coca-Cola                       │
│ 📅 01/01/2026 — 31/03/2026      │
│ 👥 2 coordenadores              │
│ ████████░░ 80% (8 de 10 pontos) │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Campanha Natal 2025             │ 🟢 Ativa
│ Ambev                           │
│ 📅 01/12/2025 — 31/12/2025      │
│ 👥 1 coordenador                │
│ ██████████ 100% (15 de 15)      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Campanha Black Friday 2025      │ ⚪ Finalizada
│ Magazine Luiza                  │
│ 📅 20/11/2025 — 30/11/2025      │
│ 👥 3 coordenadores              │
│ ██████████ 100% (20 de 20)      │
└─────────────────────────────────┘
```

---

## Dados Mantidos no Histórico

Quando uma campanha é finalizada (data_fim < hoje), ela:

✅ **Permanece no banco de dados**
✅ **Aparece na página de Campanhas** com badge "Finalizada"
✅ **Mantém todos os dados**:
   - Nome, cliente, datas
   - Coordenadores vinculados
   - Instalações realizadas
   - Progresso (% de conclusão)
   - Endereços utilizados

✅ **Pode ser acessada** clicando no card
✅ **Mostra detalhes completos** na página de detalhes
✅ **Pode ser editada** (se admin/operações)
✅ **Pode ser excluída** (se admin/operações)

❌ **NÃO aparece no Dashboard** (apenas ativas)

---

## Quando uma Campanha é Considerada Finalizada?

```typescript
// Lógica de verificação
const hoje = new Date();
const fim = new Date(campaign.data_fim);

if (hoje > fim) {
  // Campanha finalizada
  badge = "Finalizada" (cinza)
} else {
  // Campanha ativa
  badge = "Ativa" (verde)
}
```

**Exemplo**:
- Hoje: 25/02/2026
- Campanha A: data_fim = 31/03/2026 → **Ativa** 🟢
- Campanha B: data_fim = 31/12/2025 → **Finalizada** ⚪

---

## Melhorias Futuras (Opcional)

Se quiser melhorar a visualização de histórico:

### 1. Adicionar Filtro na Página de Campanhas

```typescript
const [filtro, setFiltro] = useState<"todas" | "ativas" | "finalizadas">("todas");

const campanhasFiltradas = campaigns?.filter((c) => {
  if (filtro === "todas") return true;
  if (filtro === "ativas") return isActive(c.data_inicio, c.data_fim);
  if (filtro === "finalizadas") return !isActive(c.data_inicio, c.data_fim);
  return true;
});
```

### 2. Adicionar Aba "Histórico" no Dashboard

```typescript
<Tabs defaultValue="ativas">
  <TabsList>
    <TabsTrigger value="ativas">Ativas</TabsTrigger>
    <TabsTrigger value="historico">Histórico</TabsTrigger>
  </TabsList>
  <TabsContent value="ativas">
    {/* Campanhas ativas */}
  </TabsContent>
  <TabsContent value="historico">
    {/* Campanhas finalizadas */}
  </TabsContent>
</Tabs>
```

### 3. Adicionar Status "Cancelada"

Atualmente só tem "Ativa" e "Finalizada". Poderia adicionar:
- Campo `status` na tabela `campanhas`
- Valores: `ativa`, `finalizada`, `cancelada`
- Badge vermelho para canceladas

---

## Resumo

| Local | Mostra Ativas | Mostra Finalizadas | Filtro |
|-------|---------------|-------------------|--------|
| Dashboard | ✅ Sim | ❌ Não | `data_fim >= hoje` |
| Página Campanhas | ✅ Sim | ✅ Sim | Nenhum (todas) |
| Detalhes | ✅ Sim | ✅ Sim | Por ID |

**Conclusão**: O histórico é mantido completamente. Campanhas finalizadas aparecem na página de Campanhas com badge "Finalizada" e podem ser acessadas normalmente.

---

## Arquivos Relevantes

- `src/hooks/useDashboardData.ts` - Hook `useCampanhasAtivas()` (filtra ativas)
- `src/hooks/useCampaignsData.ts` - Hook `useCampaigns()` (mostra todas)
- `src/pages/Dashboard.tsx` - Dashboard (só ativas)
- `src/pages/Campaigns.tsx` - Listagem completa (todas)
- `src/pages/CampaignDetail.tsx` - Detalhes (qualquer campanha)

---

## Status

✅ **FUNCIONANDO** - Histórico completo mantido, campanhas finalizadas aparecem na página de Campanhas
