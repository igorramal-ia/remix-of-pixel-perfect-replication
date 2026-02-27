# Dashboard com Dados Reais

Este documento descreve a implementação do Dashboard com dados reais do Supabase.

## Mudanças Implementadas

### 1. Hooks Personalizados (`src/hooks/useDashboardData.ts`)

Criados hooks usando React Query para buscar dados do Supabase:

#### `useTotalPontos()`
- Retorna o total de endereços cadastrados
- Query: `COUNT` da tabela `enderecos`

#### `useDistribuicaoStatus()`
- Retorna a distribuição de endereços por status
- Calcula contagem e porcentagem para cada status:
  - Disponível
  - Ocupado
  - Inativo
  - Manutenção

#### `useCampanhasAtivas()`
- Retorna campanhas com `data_fim >= hoje`
- Para cada campanha, busca:
  - Total de instalações
  - Instalações ativas
  - Progresso (%)

#### `useAtividadeRecente()`
- Retorna os últimos 5 registros de `inventario_historico`
- Faz JOIN com:
  - `enderecos` (para pegar endereço, comunidade, cidade)
  - `profiles` (para pegar nome do usuário)
- Ordenado por `alterado_em DESC`

#### `useEstatisticasInstalacoes()`
- Retorna estatísticas de instalações:
  - Total de instalações ativas
  - Total de instalações pendentes
  - Instalações com prazo vencido (data_expiracao < hoje)

#### `useComunidades()`
- Retorna o número de comunidades únicas
- Query: `SELECT DISTINCT comunidade` da tabela `enderecos`

#### `useClientes()`
- Retorna o número de clientes únicos
- Query: `SELECT DISTINCT cliente` da tabela `campanhas`

### 2. Componente de Loading (`src/components/StatCardSkeleton.tsx`)

Skeleton loader para os cards de estatísticas enquanto os dados carregam.

### 3. Dashboard Atualizado (`src/pages/Dashboard.tsx`)

#### Cards de Estatísticas
- **Total de Pontos**: Dados reais de `enderecos`
- **Campanhas Ativas**: Dados reais de `campanhas` (data_fim >= hoje)
- **Em Veiculação**: Instalações com status "ativa"
- **Para Recolher**: Instalações com prazo vencido

#### Atividade Recente
- Últimos 5 registros de `inventario_historico`
- Mostra: endereço, comunidade, usuário, tempo relativo
- Formatação de data usando `date-fns` (pt-BR)

#### Campanhas Ativas
- Lista as 3 primeiras campanhas ativas
- Mostra progresso de instalação
- Barra de progresso animada

#### Distribuição do Inventário
- Gráfico com contagem e porcentagem por status
- Cores correspondentes aos status

## Estrutura de Dados

### Tabela: enderecos
```sql
- id: UUID
- uf: TEXT
- cidade: TEXT
- comunidade: TEXT
- endereco: TEXT
- lat: DOUBLE PRECISION
- long: DOUBLE PRECISION
- status: endereco_status (disponivel, ocupado, inativo, manutencao)
```

### Tabela: campanhas
```sql
- id: UUID
- nome: TEXT
- cliente: TEXT
- data_inicio: DATE
- data_fim: DATE
- cidade: TEXT
- gestor_id: UUID
```

### Tabela: instalacoes
```sql
- id: UUID
- endereco_id: UUID
- campanha_id: UUID
- representante_id: UUID
- foto_url: TEXT
- data_instalacao: DATE
- data_expiracao: DATE
- status: instalacao_status (ativa, finalizada, cancelada, pendente)
```

### Tabela: inventario_historico
```sql
- id: UUID
- endereco_id: UUID
- status_anterior: endereco_status
- status_novo: endereco_status
- alterado_por: UUID
- alterado_em: TIMESTAMPTZ
```

## React Query

### Configuração
O React Query já está configurado no `App.tsx`:

```typescript
const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  {/* ... */}
</QueryClientProvider>
```

### Cache e Refetch
- Dados são cacheados automaticamente
- Cache key único para cada query
- Refetch automático ao focar na janela
- Stale time padrão do React Query

### Invalidação de Cache
Para forçar atualização dos dados:

```typescript
import { useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

// Invalidar uma query específica
queryClient.invalidateQueries({ queryKey: ["total-pontos"] });

// Invalidar todas as queries
queryClient.invalidateQueries();
```

## Loading States

Cada seção do dashboard tem seu próprio loading state:

1. **Cards de Estatísticas**: `StatCardSkeleton`
2. **Atividade Recente**: Skeleton inline
3. **Campanhas Ativas**: Skeleton inline
4. **Distribuição**: Skeleton grid

## Formatação de Datas

Usando `date-fns` com locale pt-BR:

```typescript
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

formatDistanceToNow(new Date(data), { 
  addSuffix: true, 
  locale: ptBR 
});
// Resultado: "há 2 horas", "há 3 dias", etc.
```

## Cores por Status

### Status de Endereços
- 🟢 Verde (`bg-green-500`): Disponível
- 🔴 Vermelho (`bg-red-500`): Ocupado
- ⚪ Cinza (`bg-gray-400`): Inativo
- 🟠 Laranja (`bg-orange-500`): Manutenção

### Status de Instalações
- 🟢 Verde (`bg-green-500`): Ativa
- 🟡 Amarelo (`bg-yellow-500`): Pendente
- ⚪ Cinza (`bg-gray-400`): Finalizada
- 🔴 Vermelho (`bg-red-500`): Cancelada

## Performance

### Otimizações Implementadas
1. **Queries paralelas**: Todos os hooks executam simultaneamente
2. **Cache**: React Query cacheia resultados
3. **Loading granular**: Cada seção carrega independentemente
4. **Skeleton loaders**: Feedback visual imediato

### Queries Executadas
Total de queries ao carregar o dashboard: **7**

1. Total de pontos
2. Distribuição por status
3. Campanhas ativas
4. Atividade recente
5. Estatísticas de instalações
6. Número de comunidades
7. Número de clientes

## Tratamento de Erros

Erros são tratados automaticamente pelo React Query:
- Retry automático (3 tentativas)
- Estado de erro disponível em cada hook
- Fallback para valores padrão (0, [], etc.)

Para adicionar tratamento customizado:

```typescript
const { data, error, isError } = useTotalPontos();

if (isError) {
  // Mostrar mensagem de erro
  toast({
    title: "Erro ao carregar dados",
    description: error.message,
    variant: "destructive",
  });
}
```

## Próximas Melhorias

Possíveis melhorias futuras:

- [ ] Filtros por período (última semana, mês, ano)
- [ ] Gráficos interativos (recharts)
- [ ] Exportar dados para Excel/PDF
- [ ] Comparação com período anterior
- [ ] Alertas em tempo real (Supabase Realtime)
- [ ] Refresh manual com botão
- [ ] Indicadores de tendência (↑↓)
- [ ] Drill-down em cada métrica

## Testes

Para testar o dashboard:

1. **Sem dados**: Verifique se mostra "Nenhuma atividade recente"
2. **Com dados**: Importe o inventário e crie campanhas
3. **Loading**: Throttle de rede no DevTools
4. **Erro**: Desconecte do Supabase e veja o comportamento

## Dependências

- `@tanstack/react-query`: Gerenciamento de estado assíncrono
- `date-fns`: Formatação de datas
- `@supabase/supabase-js`: Cliente do Supabase

Todas já estão instaladas no projeto.
