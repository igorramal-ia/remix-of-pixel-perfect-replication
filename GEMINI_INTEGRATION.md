# Integração com Google Gemini AI

Este documento descreve a integração do sistema com a API do Google Gemini para funcionalidades de IA.

## Configuração

### 1. Obter API Key

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

### 2. Configurar no Projeto

Adicione a chave no arquivo `.env`:

```bash
VITE_GEMINI_KEY="sua_chave_aqui"
```

**Importante:** Nunca commite a API Key no Git!

## Serviço Gemini

### Localização

`src/services/gemini.ts`

### Funções Disponíveis

#### `askGemini(prompt: string): Promise<string>`

Faz uma pergunta ao Gemini e retorna a resposta.

**Exemplo:**
```typescript
import { askGemini } from "@/services/gemini";

const response = await askGemini("Explique o que é marketing OOH");
console.log(response);
```

**Parâmetros:**
- `prompt` (string): A pergunta ou instrução para o Gemini

**Retorna:**
- `Promise<string>`: A resposta gerada pelo Gemini

**Lança:**
- `Error`: Se a API Key não estiver configurada
- `Error`: Se o prompt estiver vazio
- `Error`: Se houver erro na requisição

#### `testGeminiConnection(): Promise<boolean>`

Testa se a conexão com a API está funcionando.

**Exemplo:**
```typescript
import { testGeminiConnection } from "@/services/gemini";

const isConnected = await testGeminiConnection();
if (isConnected) {
  console.log("API funcionando!");
}
```

**Retorna:**
- `Promise<boolean>`: `true` se a API está funcionando, `false` caso contrário

#### `gerarEstrategiaCampanha(dados): Promise<string>`

Gera sugestões estratégicas para campanhas OOH.

**Exemplo:**
```typescript
import { gerarEstrategiaCampanha } from "@/services/gemini";

const estrategia = await gerarEstrategiaCampanha({
  cliente: "Coca-Cola",
  cidades: ["Rio de Janeiro", "São Paulo"],
  comunidades: ["Rocinha", "Paraisópolis"],
  objetivo: "Aumentar awareness da marca"
});

console.log(estrategia);
```

**Parâmetros:**
```typescript
{
  cliente: string;
  cidades: string[];
  comunidades?: string[];
  objetivo?: string;
}
```

**Retorna:**
- `Promise<string>`: Estratégia detalhada gerada pelo Gemini

#### `analisarCampanha(dados): Promise<string>`

Analisa dados de uma campanha e gera insights.

**Exemplo:**
```typescript
import { analisarCampanha } from "@/services/gemini";

const analise = await analisarCampanha({
  nome: "Verão Coca-Cola 2026",
  totalPontos: 50,
  pontosInstalados: 39,
  diasRestantes: 18
});

console.log(analise);
```

**Parâmetros:**
```typescript
{
  nome: string;
  totalPontos: number;
  pontosInstalados: number;
  diasRestantes?: number;
}
```

**Retorna:**
- `Promise<string>`: Análise e recomendações geradas pelo Gemini

## Configuração da API

### Endpoint

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

### Modelo

`gemini-1.5-flash` - Modelo rápido e eficiente para geração de texto

### Parâmetros de Geração

```typescript
{
  temperature: 0.7,      // Criatividade (0-1)
  topK: 40,              // Diversidade de tokens
  topP: 0.95,            // Probabilidade cumulativa
  maxOutputTokens: 1024  // Tamanho máximo da resposta
}
```

### Safety Settings

Configurado para bloquear conteúdo:
- Assédio (HARM_CATEGORY_HARASSMENT)
- Discurso de ódio (HARM_CATEGORY_HATE_SPEECH)
- Conteúdo sexual explícito (HARM_CATEGORY_SEXUALLY_EXPLICIT)
- Conteúdo perigoso (HARM_CATEGORY_DANGEROUS_CONTENT)

Threshold: `BLOCK_MEDIUM_AND_ABOVE`

## Página de Teste

### Acesso

http://localhost:5173/test-gemini

### Funcionalidades

1. **Status da Configuração**
   - Verifica se VITE_GEMINI_KEY está configurada
   - Mostra status visual (✓ ou ✗)

2. **Teste de Conexão**
   - Botão para testar se a API está respondendo
   - Feedback visual do resultado

3. **Teste de Prompt**
   - Campo para digitar perguntas
   - Botão para enviar ao Gemini
   - Exibição da resposta

4. **Exemplos de Prompts**
   - Prompts pré-definidos para teste rápido
   - Clique para usar

## Testes Automatizados

### Localização

`src/test/gemini.test.ts`

### Executar Testes

```bash
npm run test
```

### Testes Incluídos

1. Validação de API Key
2. Validação de prompt vazio
3. Teste de resposta válida (requer API Key)
4. Teste de conexão (requer API Key)

## Tratamento de Erros

### Erros Comuns

#### API Key não configurada
```
Error: VITE_GEMINI_KEY não está configurada
```
**Solução:** Configure a variável de ambiente no `.env`

#### Prompt vazio
```
Error: O prompt não pode estar vazio
```
**Solução:** Forneça um prompt válido

#### Erro na API
```
Error: Erro na API do Gemini: [mensagem] (status)
```
**Solução:** Verifique:
- API Key válida
- Quota não excedida
- Conexão com internet

#### Sem resposta
```
Error: Nenhuma resposta foi gerada pelo Gemini
```
**Solução:** O conteúdo pode ter sido bloqueado pelos filtros de segurança

## Custos

### Modelo gemini-1.5-flash

**Gratuito até:**
- 15 requisições por minuto (RPM)
- 1 milhão de tokens por minuto (TPM)
- 1.500 requisições por dia (RPD)

**Após o limite gratuito:**
- Input: $0.075 por 1 milhão de tokens
- Output: $0.30 por 1 milhão de tokens

### Estimativa de Uso

- Prompt médio: ~100 tokens
- Resposta média: ~500 tokens
- Custo por requisição: ~$0.00006 (após limite gratuito)

## Boas Práticas

### 1. Cache de Respostas

Para perguntas frequentes, considere cachear as respostas:

```typescript
const cache = new Map<string, string>();

async function askGeminiCached(prompt: string): Promise<string> {
  if (cache.has(prompt)) {
    return cache.get(prompt)!;
  }
  
  const response = await askGemini(prompt);
  cache.set(prompt, response);
  return response;
}
```

### 2. Rate Limiting

Implemente rate limiting para evitar exceder quotas:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Máximo 10 requisições simultâneas

const responses = await Promise.all(
  prompts.map(prompt => limit(() => askGemini(prompt)))
);
```

### 3. Timeout

Adicione timeout para requisições longas:

```typescript
async function askGeminiWithTimeout(
  prompt: string, 
  timeoutMs: number = 30000
): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  return Promise.race([
    askGemini(prompt),
    timeoutPromise
  ]);
}
```

### 4. Retry com Backoff

Para requisições que falharam:

```typescript
async function askGeminiWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await askGemini(prompt);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Casos de Uso no Sistema

### 1. Estratégia de Campanhas

Na página `/ia`, usar `gerarEstrategiaCampanha()` para:
- Sugerir locais estratégicos
- Recomendar mensagens
- Definir timing ideal

### 2. Análise de Performance

No dashboard, usar `analisarCampanha()` para:
- Avaliar progresso
- Identificar problemas
- Sugerir otimizações

### 3. Assistente de Criação

Ao criar campanhas, usar `askGemini()` para:
- Sugerir nomes criativos
- Gerar descrições
- Recomendar públicos-alvo

### 4. Insights de Dados

Nos relatórios, usar para:
- Interpretar métricas
- Identificar tendências
- Gerar recomendações

## Segurança

### Proteção da API Key

1. **Nunca exponha no frontend**
   - Use variáveis de ambiente
   - Não inclua em código versionado

2. **Restrições no Google Cloud**
   - Configure restrições de domínio
   - Limite APIs permitidas
   - Configure quotas

3. **Monitoramento**
   - Acompanhe uso no console
   - Configure alertas de quota
   - Revise logs regularmente

## Recursos Adicionais

- [Documentação oficial do Gemini](https://ai.google.dev/docs)
- [API Reference](https://ai.google.dev/api/rest)
- [Pricing](https://ai.google.dev/pricing)
- [Exemplos](https://ai.google.dev/examples)
- [Limites e Quotas](https://ai.google.dev/docs/quota)
