# Design Técnico: IA Consultiva

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     IAConsultivaPage                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ChatInterface Component                 │   │
│  │  - Input field                                       │   │
│  │  - Message history                                   │   │
│  │  - Suggested questions                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Question Interpreter                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pattern Matching Engine                             │  │
│  │  - Regex patterns                                    │  │
│  │  - Keyword detection                                 │  │
│  │  - Intent classification                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Query Executor                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Client                                     │  │
│  │  - Pre-defined queries                               │  │
│  │  - Parameter binding                                 │  │
│  │  - RLS enforcement                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Formatter                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Natural Language Generator                          │  │
│  │  - Number formatting                                 │  │
│  │  - Date formatting                                   │  │
│  │  - Context enrichment                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. IAConsultivaPage (src/pages/IAConsultivaPage.tsx)
Página principal que contém a interface do chat.

**Responsabilidades:**
- Renderizar interface de chat
- Gerenciar estado das mensagens
- Coordenar fluxo de pergunta → resposta

**Estado:**
```typescript
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
```

### 2. QuestionInterpreter (src/services/questionInterpreter.ts)
Serviço que interpreta perguntas em linguagem natural.

**Interface:**
```typescript
interface QuestionIntent {
  type: 'relatorios' | 'campanhas' | 'enderecos' | 'instalacoes' | 'estatisticas' | 'unknown';
  action: 'count' | 'list' | 'ranking' | 'status';
  filters: {
    periodo?: { inicio: Date; fim: Date };
    estado?: string;
    cidade?: string;
    status?: string;
  };
  confidence: number; // 0-1
}

function interpretQuestion(question: string): QuestionIntent;
```

**Padrões de Reconhecimento:**
```typescript
const patterns = {
  relatorios: {
    count: /quantos?\s+relat[oó]rios?/i,
    periodo: /(?:no|do|da)?\s*(último|última|este|esta)\s+(mês|semana|ano)/i,
  },
  campanhas: {
    count: /quantas?\s+campanhas?/i,
    ativas: /campanhas?\s+ativas?/i,
    estado: /em\s+([A-Z]{2})/i,
  },
  enderecos: {
    count: /quantos?\s+endere[çc]os?/i,
    disponiveis: /endere[çc]os?\s+dispon[íi]veis?/i,
    ocupados: /endere[çc]os?\s+ocupados?/i,
  },
  instalacoes: {
    count: /quantas?\s+instala[çc][õo]es?/i,
    ativas: /instala[çc][õo]es?\s+ativas?/i,
  },
};
```

### 3. QueryExecutor (src/services/queryExecutor.ts)
Executa queries no Supabase baseado no intent identificado.

**Interface:**
```typescript
interface QueryResult {
  success: boolean;
  data: any;
  error?: string;
}

async function executeQuery(intent: QuestionIntent): Promise<QueryResult>;
```

**Queries Pré-definidas:**
```typescript
const queries = {
  // Relatórios
  countRelatorios: async (filters) => {
    let query = supabase
      .from('relatorios_gerados')
      .select('*', { count: 'exact', head: true });
    
    if (filters.periodo) {
      query = query
        .gte('created_at', filters.periodo.inicio)
        .lte('created_at', filters.periodo.fim);
    }
    
    return query;
  },
  
  // Campanhas
  countCampanhas: async (filters) => {
    let query = supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true });
    
    if (filters.status === 'ativas') {
      query = query
        .lte('data_inicio', new Date().toISOString())
        .gte('data_fim', new Date().toISOString());
    }
    
    return query;
  },
  
  // Endereços
  countEnderecos: async (filters) => {
    let query = supabase
      .from('enderecos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    
    if (filters.estado) {
      query = query.eq('uf', filters.estado);
    }
    
    return query;
  },
  
  // Instalações
  countInstalacoes: async (filters) => {
    let query = supabase
      .from('instalacoes')
      .select('*', { count: 'exact', head: true });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    return query;
  },
};
```

### 4. ResponseFormatter (src/services/responseFormatter.ts)
Formata respostas em linguagem natural.

**Interface:**
```typescript
interface FormattedResponse {
  text: string;
  suggestions?: string[];
}

function formatResponse(
  intent: QuestionIntent,
  result: QueryResult
): FormattedResponse;
```

**Templates de Resposta:**
```typescript
const templates = {
  relatorios: {
    count: (count: number, periodo?: string) => {
      const periodoText = periodo ? ` ${periodo}` : '';
      return `Foram gerados ${count.toLocaleString('pt-BR')} relatórios${periodoText}.`;
    },
  },
  
  campanhas: {
    count: (count: number, status?: string) => {
      const statusText = status ? ` ${status}` : '';
      return `Existem ${count.toLocaleString('pt-BR')} campanhas${statusText} no sistema.`;
    },
  },
  
  enderecos: {
    count: (count: number, tipo?: string) => {
      const tipoText = tipo ? ` ${tipo}` : '';
      return `Há ${count.toLocaleString('pt-BR')} endereços${tipoText} cadastrados.`;
    },
  },
};
```

### 5. SuggestedQuestions (src/components/SuggestedQuestions.tsx)
Componente que exibe perguntas sugeridas.

**Perguntas Sugeridas:**
```typescript
const suggestedQuestions = {
  relatorios: [
    "Quantos relatórios foram gerados?",
    "Quantos relatórios foram gerados no último mês?",
    "Quantos relatórios foram gerados esta semana?",
  ],
  campanhas: [
    "Quantas campanhas ativas existem?",
    "Quantas campanhas foram finalizadas?",
    "Qual campanha tem mais instalações?",
  ],
  enderecos: [
    "Quantos endereços estão disponíveis?",
    "Quantos endereços estão ocupados?",
    "Quantos endereços existem em SP?",
  ],
  instalacoes: [
    "Quantas instalações ativas existem?",
    "Quantas instalações estão pendentes?",
    "Quantas instalações foram finalizadas?",
  ],
  geral: [
    "Mostre estatísticas gerais do sistema",
    "Qual o total de endereços cadastrados?",
  ],
};
```

## Fluxo de Dados

### Fluxo de Pergunta → Resposta

```
1. Usuário digita pergunta
   ↓
2. QuestionInterpreter analisa a pergunta
   ↓
3. Identifica intent e extrai filtros
   ↓
4. QueryExecutor monta e executa query
   ↓
5. Supabase retorna dados (com RLS)
   ↓
6. ResponseFormatter gera resposta em linguagem natural
   ↓
7. Interface exibe resposta ao usuário
```

### Exemplo Completo

**Input:** "Quantos relatórios foram gerados no último mês?"

**1. Interpretação:**
```typescript
{
  type: 'relatorios',
  action: 'count',
  filters: {
    periodo: {
      inicio: new Date('2026-02-01'),
      fim: new Date('2026-03-01')
    }
  },
  confidence: 0.95
}
```

**2. Query:**
```sql
SELECT COUNT(*) FROM relatorios_gerados
WHERE created_at >= '2026-02-01'
  AND created_at <= '2026-03-01'
```

**3. Resultado:**
```typescript
{ success: true, data: { count: 15 } }
```

**4. Resposta Formatada:**
```
"Foram gerados 15 relatórios no último mês."

Sugestões:
- Quantos relatórios foram gerados esta semana?
- Qual campanha gerou mais relatórios?
```

## Estrutura de Arquivos

```
src/
├── pages/
│   └── IAConsultivaPage.tsx          # Página principal
├── components/
│   ├── ChatInterface.tsx             # Interface do chat
│   ├── MessageBubble.tsx             # Bolha de mensagem
│   ├── SuggestedQuestions.tsx        # Perguntas sugeridas
│   └── TypingIndicator.tsx           # Indicador de "digitando"
├── services/
│   ├── questionInterpreter.ts        # Interpretador de perguntas
│   ├── queryExecutor.ts              # Executor de queries
│   └── responseFormatter.ts          # Formatador de respostas
├── hooks/
│   └── useIAConsultiva.ts            # Hook principal
└── types/
    └── iaConsultiva.ts               # Tipos TypeScript
```

## Tipos TypeScript

```typescript
// src/types/iaConsultiva.ts

export type MessageType = 'user' | 'assistant';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  loading?: boolean;
}

export type IntentType = 
  | 'relatorios' 
  | 'campanhas' 
  | 'enderecos' 
  | 'instalacoes' 
  | 'estatisticas' 
  | 'unknown';

export type ActionType = 'count' | 'list' | 'ranking' | 'status';

export interface QuestionFilters {
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  estado?: string;
  cidade?: string;
  status?: string;
}

export interface QuestionIntent {
  type: IntentType;
  action: ActionType;
  filters: QuestionFilters;
  confidence: number;
}

export interface QueryResult {
  success: boolean;
  data: any;
  error?: string;
}

export interface FormattedResponse {
  text: string;
  suggestions?: string[];
}
```

## Tratamento de Erros

### Cenários de Erro

1. **Pergunta não entendida** (confidence < 0.5)
   ```
   "Desculpe, não entendi sua pergunta. Tente reformular ou escolha uma das sugestões abaixo."
   ```

2. **Erro na query**
   ```
   "Ocorreu um erro ao buscar os dados. Por favor, tente novamente."
   ```

3. **Sem resultados**
   ```
   "Não encontrei dados para essa consulta. Verifique os filtros e tente novamente."
   ```

4. **Timeout**
   ```
   "A consulta está demorando muito. Tente uma pergunta mais específica."
   ```

## Performance

### Otimizações

1. **Debounce no input** (300ms)
2. **Cache de queries frequentes** (React Query)
3. **Índices no banco de dados:**
   - `relatorios_gerados(created_at)`
   - `campanhas(data_inicio, data_fim)`
   - `enderecos(uf, ativo)`
   - `instalacoes(status)`

4. **Lazy loading de mensagens antigas**
5. **Virtualização da lista de mensagens** (se > 50 mensagens)

## Segurança

### Medidas de Segurança

1. **RLS do Supabase** - Todas as queries respeitam Row Level Security
2. **Queries pré-definidas** - Não permite SQL arbitrário
3. **Sanitização de input** - Remove caracteres especiais
4. **Rate limiting** - Máximo 10 perguntas por minuto
5. **Validação de filtros** - Valida datas, estados, etc.

## Testes

### Casos de Teste

1. **Interpretação de perguntas:**
   - Variações de sintaxe
   - Perguntas ambíguas
   - Perguntas com erros de digitação

2. **Execução de queries:**
   - Queries com filtros
   - Queries sem resultados
   - Queries com erros

3. **Formatação de respostas:**
   - Números grandes
   - Datas em diferentes formatos
   - Respostas vazias

4. **Performance:**
   - Tempo de resposta < 2s
   - Múltiplas perguntas simultâneas
   - Histórico com 100+ mensagens

## Extensibilidade

### Como Adicionar Novos Tipos de Pergunta

1. **Adicionar padrão em `questionInterpreter.ts`:**
   ```typescript
   const patterns = {
     // ... existentes
     novoTipo: {
       pattern: /regex aqui/i,
     },
   };
   ```

2. **Adicionar query em `queryExecutor.ts`:**
   ```typescript
   const queries = {
     // ... existentes
     novaQuery: async (filters) => {
       // implementação
     },
   };
   ```

3. **Adicionar template em `responseFormatter.ts`:**
   ```typescript
   const templates = {
     // ... existentes
     novoTipo: (data) => `Resposta formatada: ${data}`,
   };
   ```

4. **Adicionar sugestões em `SuggestedQuestions.tsx`:**
   ```typescript
   const suggestedQuestions = {
     // ... existentes
     novoTipo: ["Pergunta exemplo 1", "Pergunta exemplo 2"],
   };
   ```

## Roadmap Futuro

### Fase 2 (Pós-MVP):
- IA real com NLP (OpenAI, Anthropic)
- Histórico persistente no banco
- Gráficos nas respostas
- Exportar conversas
- Feedback do usuário (👍👎)
- Aprendizado com uso

### Fase 3:
- Múltiplos idiomas
- Voz (speech-to-text)
- Integração com WhatsApp/Telegram
- Alertas proativos
- Análises preditivas
