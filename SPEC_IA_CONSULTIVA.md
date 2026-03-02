# 🤖 Especificação: IA Consultiva (ChatGPT Interno)

## 🎯 Objetivo

Transformar a página "IA Estratégia" em um assistente consultivo que responde perguntas sobre os dados do sistema usando linguagem natural.

---

## 💡 Conceito

Um chat onde o usuário pode fazer perguntas sobre:
- Relatórios gerados
- Campanhas ativas/finalizadas
- Endereços mais veiculados
- Performance por coordenador
- Estatísticas gerais
- Histórico de mudanças

**Exemplo de conversa**:
```
👤 Usuário: Quantos relatórios foram gerados no último mês?
🤖 IA: Foram gerados 15 relatórios no último mês (fevereiro/2026).

👤 Usuário: Qual campanha tem mais instalações ativas?
🤖 IA: A campanha "Mario sergio" tem 2 instalações ativas, sendo a que mais tem no momento.

👤 Usuário: Mostre os endereços mais veiculados
🤖 IA: Top 5 endereços mais veiculados:
1. Rua X - 5 veiculações
2. Rua Y - 4 veiculações
...
```

---

## 🏗️ Arquitetura

### Opção 1: IA Real (OpenAI/Anthropic)
**Prós**:
- Respostas naturais e inteligentes
- Entende contexto complexo
- Pode gerar insights

**Contras**:
- Custo por requisição
- Precisa API Key
- Latência maior

### Opção 2: Sistema de Regras (Recomendado para MVP)
**Prós**:
- Sem custo adicional
- Resposta instantânea
- Controle total

**Contras**:
- Menos flexível
- Precisa mapear perguntas

**Decisão**: Começar com Opção 2, depois evoluir para Opção 1

---

## 📋 Funcionalidades

### Fase 1 (MVP)
1. **Interface de Chat**
   - Input de mensagem
   - Histórico de conversa
   - Indicador de "digitando..."

2. **Perguntas Suportadas**:
   - Relatórios gerados (total, por período)
   - Campanhas (ativas, finalizadas, total)
   - Instalações (ativas, finalizadas, por campanha)
   - Endereços (total, disponíveis, ocupados)
   - Top endereços mais veiculados
   - Performance por coordenador

3. **Respostas**:
   - Texto formatado
   - Números/estatísticas
   - Sugestões de próximas perguntas

### Fase 2 (Futuro)
- Gráficos nas respostas
- Exportar conversa
- Integração com IA real
- Análise preditiva

---

## 🎨 Design da Interface

```
┌─────────────────────────────────────────┐
│  🤖 Assistente Digital Favela           │
├─────────────────────────────────────────┤
│                                         │
│  [Histórico de Mensagens]               │
│                                         │
│  👤 Quantos relatórios foram gerados?   │
│                                         │
│  🤖 Foram gerados 15 relatórios no      │
│     último mês.                         │
│                                         │
│  👤 E campanhas ativas?                 │
│                                         │
│  🤖 Você tem 3 campanhas ativas no      │
│     momento.                            │
│                                         │
├─────────────────────────────────────────┤
│  💬 Digite sua pergunta...         [>]  │
└─────────────────────────────────────────┘

Sugestões:
• Quantos endereços estão disponíveis?
• Qual coordenador tem mais instalações?
• Mostre o histórico de mudanças
```

---

## 🔧 Implementação Técnica

### 1. Estrutura de Dados

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QueryResult {
  type: 'text' | 'number' | 'list' | 'chart';
  data: any;
}
```

### 2. Sistema de Análise de Perguntas

```typescript
// Mapear palavras-chave para queries
const intentMap = {
  'relatórios': ['relatórios', 'relatorio', 'ppt', 'powerpoint'],
  'campanhas': ['campanhas', 'campanha'],
  'instalações': ['instalações', 'instalacao', 'pontos'],
  'endereços': ['endereços', 'endereco', 'locais'],
  // ...
};

// Detectar período
const periodMap = {
  'último mês': () => lastMonth(),
  'esta semana': () => thisWeek(),
  'hoje': () => today(),
  // ...
};
```

### 3. Serviço de Consultas

```typescript
// src/services/iaConsultivaService.ts
export async function processarPergunta(pergunta: string) {
  // 1. Analisar intenção
  const intent = detectarIntencao(pergunta);
  
  // 2. Extrair parâmetros (período, filtros)
  const params = extrairParametros(pergunta);
  
  // 3. Executar query no Supabase
  const resultado = await executarQuery(intent, params);
  
  // 4. Formatar resposta
  return formatarResposta(resultado);
}
```

### 4. Componentes

- `IAConsultivaPage.tsx` - Página principal
- `ChatMessage.tsx` - Componente de mensagem
- `ChatInput.tsx` - Input com sugestões
- `SuggestionChips.tsx` - Chips de sugestões

---

## 📊 Queries Suportadas

### Relatórios
```sql
-- Total de relatórios
SELECT COUNT(*) FROM relatorios_gerados;

-- Relatórios por período
SELECT COUNT(*) FROM relatorios_gerados 
WHERE criado_em >= '2026-02-01' AND criado_em < '2026-03-01';
```

### Campanhas
```sql
-- Campanhas ativas
SELECT COUNT(*) FROM campanhas 
WHERE data_fim >= CURRENT_DATE OR data_fim IS NULL;

-- Campanha com mais instalações
SELECT c.nome, COUNT(i.id) as total
FROM campanhas c
LEFT JOIN instalacoes i ON c.id = i.campanha_id
WHERE i.status = 'ativa'
GROUP BY c.id, c.nome
ORDER BY total DESC
LIMIT 1;
```

### Endereços
```sql
-- Endereços mais veiculados
SELECT e.endereco, e.comunidade, COUNT(i.id) as veiculacoes
FROM enderecos e
LEFT JOIN instalacoes i ON e.id = i.endereco_id
GROUP BY e.id, e.endereco, e.comunidade
ORDER BY veiculacoes DESC
LIMIT 5;
```

---

## 🚀 Plano de Implementação

### Etapa 1: Interface Básica
- [ ] Criar página IAConsultivaPage
- [ ] Componente de chat
- [ ] Input de mensagem
- [ ] Histórico de conversa

### Etapa 2: Sistema de Análise
- [ ] Serviço iaConsultivaService
- [ ] Detecção de intenção
- [ ] Extração de parâmetros
- [ ] Mapeamento de queries

### Etapa 3: Queries e Respostas
- [ ] Implementar queries básicas
- [ ] Formatação de respostas
- [ ] Tratamento de erros

### Etapa 4: UX
- [ ] Sugestões de perguntas
- [ ] Indicador de "digitando"
- [ ] Mensagens de boas-vindas
- [ ] Feedback visual

---

## 🎯 Perguntas Iniciais Suportadas

1. "Quantos relatórios foram gerados?"
2. "Quantas campanhas estão ativas?"
3. "Quantos endereços estão disponíveis?"
4. "Qual campanha tem mais instalações?"
5. "Mostre os endereços mais veiculados"
6. "Quantas instalações foram finalizadas?"
7. "Qual coordenador tem mais pontos?"
8. "Quantos pontos foram instalados hoje?"

---

## 💰 Estimativa

**Tempo de desenvolvimento**: 4-6 horas
**Complexidade**: Média-Alta
**Valor para o usuário**: Alto

---

## 🔮 Evolução Futura

1. **Integração com IA Real**
   - OpenAI GPT-4
   - Anthropic Claude
   - Respostas mais naturais

2. **Análise Preditiva**
   - "Quando vou atingir 100 instalações?"
   - "Qual a tendência de crescimento?"

3. **Ações Diretas**
   - "Crie uma campanha em São Paulo"
   - "Gere um relatório da campanha X"

4. **Multimodal**
   - Upload de imagens
   - Análise de fotos
   - Geração de gráficos

---

## ✅ Decisão

Implementar IA Consultiva com sistema de regras (MVP) e evoluir para IA real posteriormente.

**Próximo passo**: Começar implementação?
