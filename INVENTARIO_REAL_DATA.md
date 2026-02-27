# Inventário com Dados Reais

Este documento descreve a implementação da página de Inventário com dados reais do Supabase.

## Mudanças Implementadas

### 1. Hook de Dados (`src/hooks/useInventoryData.ts`)

#### `useInventory()`
Busca todos os endereços com informações relacionadas:

**Query principal:**
```sql
SELECT 
  enderecos.*,
  proprietarios.nome
FROM enderecos
LEFT JOIN proprietarios ON proprietarios.endereco_id = enderecos.id
ORDER BY criado_em DESC
```

**Para cada endereço, busca instalação ativa:**
```sql
SELECT 
  instalacoes.data_expiracao,
  campanhas.nome
FROM instalacoes
JOIN campanhas ON campanhas.id = instalacoes.campanha_id
WHERE instalacoes.endereco_id = ? 
  AND instalacoes.status = 'ativa'
```

**Cálculo de dias restantes:**
```typescript
const hoje = new Date();
const expiracao = new Date(data_expiracao);
const diffTime = expiracao.getTime() - hoje.getTime();
const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
```

#### `useCreateEndereco()`
Mutation para criar novo endereço:
- Insere na tabela `enderecos`
- Define status como "disponivel"
- Associa ao usuário logado (`criado_por`)
- Invalida cache das queries relacionadas

#### `geocodeAddress()`
Função para buscar coordenadas via Google Maps Geocoding API:

**Endpoint:**
```
https://maps.googleapis.com/maps/api/geocode/json?address={endereco}&key={apiKey}
```

**Retorno:**
```typescript
{
  lat: number,
  lng: number
}
```

### 2. Modal de Novo Endereço (`src/components/NovoEnderecoModal.tsx`)

Formulário com validação usando React Hook Form + Zod:

**Campos:**
- UF (select com todos os estados brasileiros)
- Cidade (input text)
- Comunidade (input text)
- Endereço (input text)

**Fluxo de cadastro:**
1. Usuário preenche o formulário
2. Ao submeter, busca coordenadas via Google Maps Geocoding API
3. Mostra feedback visual durante geocoding
4. Salva no Supabase com ou sem coordenadas
5. Invalida cache e atualiza lista
6. Fecha modal e mostra toast de sucesso

**Estados:**
- `geocoding`: Buscando coordenadas
- `isPending`: Salvando no banco
- Desabilita botão durante operações

### 3. Página de Inventário (`src/pages/Inventory.tsx`)

#### Funcionalidades

**Busca:**
- Busca por endereço, comunidade ou cidade
- Filtro em tempo real

**Filtros por status:**
- Todos
- Disponível
- Ocupado
- Inativo
- Manutenção

**Tabela:**
- Endereço (com ícone de pin)
- Comunidade
- Cidade/UF
- Status (badge colorido)
- Proprietário (ou "-" se não tiver)
- Campanha (ou "-" se não tiver)
- Dias restantes (com cores de alerta)

**Loading states:**
- Skeleton na contagem de endereços
- Skeleton em cada linha da tabela (5 linhas)
- Skeleton em cada célula

**Estados vazios:**
- Sem endereços cadastrados
- Sem resultados para os filtros

#### Cores de Alerta (Dias Restantes)

- **Vermelho + pulsando**: 0 dias ou menos (vencido)
- **Laranja**: 1-7 dias (alerta)
- **Normal**: 8+ dias
- **"-"**: Sem instalação ativa

## Estrutura de Dados

### Interface InventoryItem
```typescript
interface InventoryItem {
  id: string;
  endereco: string;
  comunidade: string;
  cidade: string;
  uf: string;
  status: "disponivel" | "ocupado" | "inativo" | "manutencao";
  lat: number | null;
  long: number | null;
  proprietario_nome: string | null;
  campanha_nome: string | null;
  dias_restantes: number | null;
  data_expiracao: string | null;
}
```

## Google Maps Geocoding API

### Configuração

A API Key deve estar configurada em `.env`:
```bash
VITE_GOOGLE_MAPS_KEY="sua_chave_aqui"
```

### Ativação no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Ative a **Geocoding API**
3. Configure restrições:
   - Referenciadores HTTP (sites)
   - Apenas Geocoding API

### Formato da Requisição

```
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=Rua da Paz, 123, Rio de Janeiro, RJ, Brasil
  &key=AIzaSy...
```

### Resposta de Sucesso

```json
{
  "status": "OK",
  "results": [
    {
      "geometry": {
        "location": {
          "lat": -22.9876,
          "lng": -43.2485
        }
      }
    }
  ]
}
```

### Tratamento de Erros

- **ZERO_RESULTS**: Endereço não encontrado
- **OVER_QUERY_LIMIT**: Limite de requisições excedido
- **REQUEST_DENIED**: API Key inválida ou sem permissão
- **INVALID_REQUEST**: Parâmetros inválidos

Se a geocodificação falhar, o endereço é salvo sem coordenadas (lat/long = null).

## Custos da Geocoding API

### Crédito Gratuito
- $200/mês de crédito gratuito
- Suficiente para ~40.000 requisições/mês

### Após o crédito
- $5 por 1.000 requisições

### Otimizações
1. Cache de coordenadas no banco
2. Não refazer geocoding para endereços já cadastrados
3. Batch geocoding para importações em massa

## Performance

### Queries Executadas

Para carregar a página de inventário:
1. Query principal: busca todos os endereços com proprietários
2. Para cada endereço: busca instalação ativa (N queries)

**Total**: 1 + N queries (onde N = número de endereços)

### Otimização Futura

Criar uma view materializada no Supabase:

```sql
CREATE MATERIALIZED VIEW inventory_view AS
SELECT 
  e.*,
  p.nome as proprietario_nome,
  i.data_expiracao,
  c.nome as campanha_nome
FROM enderecos e
LEFT JOIN proprietarios p ON p.endereco_id = e.id
LEFT JOIN instalacoes i ON i.endereco_id = e.id AND i.status = 'ativa'
LEFT JOIN campanhas c ON c.id = i.campanha_id;

-- Refresh periódico
REFRESH MATERIALIZED VIEW inventory_view;
```

Isso reduziria para apenas 1 query.

## Validações

### Formulário de Novo Endereço

```typescript
const formSchema = z.object({
  uf: z.string().min(2, "Selecione o estado"),
  cidade: z.string().min(2, "Digite a cidade"),
  comunidade: z.string().min(2, "Digite a comunidade"),
  endereco: z.string().min(5, "Digite o endereço completo"),
});
```

### Políticas RLS

O usuário precisa ter permissão para:
- **SELECT** em `enderecos`, `proprietarios`, `instalacoes`, `campanhas`
- **INSERT** em `enderecos` (com `criado_por = auth.uid()`)

## Estados de Loading

### Página Principal
```typescript
const { data, isLoading } = useInventory();

if (isLoading) {
  // Mostrar skeleton
}
```

### Modal de Cadastro
```typescript
const [geocoding, setGeocoding] = useState(false);
const createEndereco = useCreateEndereco();

// Estados:
// - geocoding: Buscando coordenadas
// - createEndereco.isPending: Salvando no banco
```

## Filtros

### Busca por Texto
```typescript
const matchesSearch =
  item.endereco.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.comunidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.cidade.toLowerCase().includes(searchQuery.toLowerCase());
```

### Filtro por Status
```typescript
const matchesStatus = 
  statusFilter === "all" || 
  item.status === statusFilter;
```

## Cores por Status

```typescript
const colors = {
  disponivel: "bg-green-500",   // Verde
  ocupado: "bg-red-500",         // Vermelho
  inativo: "bg-gray-400",        // Cinza
  manutencao: "bg-orange-500",   // Laranja
};
```

## Próximas Funcionalidades

Possíveis melhorias:

- [ ] Editar endereço existente
- [ ] Excluir endereço
- [ ] Cadastrar proprietário inline
- [ ] Vincular/desvincular campanha
- [ ] Alterar status em massa
- [ ] Exportar para Excel
- [ ] Importar de Excel (já existe script Python)
- [ ] Visualizar no mapa (link para /mapa com filtro)
- [ ] Histórico de alterações por endereço
- [ ] Upload de fotos do local
- [ ] Paginação (para muitos registros)
- [ ] Ordenação por coluna

## Testes

### Cenários de Teste

1. **Sem endereços**: Verificar mensagem vazia
2. **Com endereços**: Verificar listagem
3. **Busca**: Testar filtro de texto
4. **Filtro por status**: Testar cada status
5. **Cadastro com API Key**: Verificar geocoding
6. **Cadastro sem API Key**: Verificar salvamento sem coordenadas
7. **Erro de geocoding**: Verificar tratamento
8. **Erro ao salvar**: Verificar toast de erro
9. **Loading**: Verificar skeleton
10. **Dias restantes**: Verificar cores de alerta

## Dependências

- `@tanstack/react-query`: Gerenciamento de estado
- `react-hook-form`: Formulário
- `zod`: Validação
- `@hookform/resolvers`: Integração Zod + React Hook Form
- Google Maps Geocoding API: Busca de coordenadas

Todas já estão instaladas no projeto.
