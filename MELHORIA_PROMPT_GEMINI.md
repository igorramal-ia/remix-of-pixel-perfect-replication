# Melhoria: Prompt do Gemini para JSON Puro

## Problema
O prompt anterior era verboso e não enfatizava suficientemente que a resposta deveria ser JSON puro, resultando em respostas com texto explicativo.

## Solução Aplicada

### Mudanças no Prompt

#### 1. Instrução clara no início
```
IMPORTANTE: Responda APENAS com JSON puro, sem texto antes ou depois, sem markdown, sem explicações.
```

Colocada logo no início para que a IA veja imediatamente a restrição.

#### 2. Dados estruturados em JSON
**Antes:**
```
ENDEREÇOS DISPONÍVEIS:
1. Rua A, Comunidade X, São Paulo/SP (ID: abc-123)
2. Rua B, Comunidade Y, São Paulo/SP (ID: def-456)
```

**Depois:**
```javascript
const enderecosDisponiveis = enderecos?.map((e) => ({
  id: e.id,
  endereco: e.endereco,
  comunidade: e.comunidade,
  cidade: e.cidade,
  uf: e.uf,
})) || [];

// No prompt:
- Endereços disponíveis: ${JSON.stringify(enderecosDisponiveis, null, 2)}
```

Vantagens:
- Formato consistente (JSON → JSON)
- Mais fácil para IA processar
- Menos ambiguidade

#### 3. Prompt mais conciso
**Antes:** ~40 linhas com formatação verbosa
**Depois:** ~20 linhas focadas no essencial

#### 4. Exemplo de formato no final
```
Retorne EXATAMENTE neste formato JSON:
{
  "coordenador_id": "uuid do coordenador sugerido",
  "coordenador_nome": "nome do coordenador",
  "endereco_ids": ["uuid1", "uuid2"],
  "justificativa": "motivo da sugestão em uma frase"
}
```

Palavra-chave "EXATAMENTE" reforça a necessidade de seguir o formato.

## Comparação Antes/Depois

### Prompt Anterior (Com Endereços)
```
Você é um especialista em planejamento de campanhas OOH (Out of Home) em comunidades periféricas.

TAREFA: Sugerir o melhor coordenador e endereços para uma campanha.

DADOS DA CAMPANHA:
- Região alvo: Heliópolis, São Paulo/SP
- Quantidade de pontos necessários: 5
- Comunidade específica: Heliópolis

ENDEREÇOS DISPONÍVEIS:
1. Rua A, Heliópolis, São Paulo/SP (ID: abc-123)
2. Rua B, Heliópolis, São Paulo/SP (ID: def-456)
...

COORDENADORES DISPONÍVEIS:
1. João Silva (ID: coord-1)
   - Cidades: São Paulo
   - Comunidades: Heliópolis, Paraisópolis
...

INSTRUÇÕES:
1. Escolha o coordenador cujo território melhor cobre a região alvo
2. Selecione exatamente 5 endereços que estejam dentro do território do coordenador
3. Priorize endereços em locais de alto tráfego e visibilidade

RESPONDA APENAS NO SEGUINTE FORMATO JSON (sem markdown, sem explicações extras):
{...}
```

### Prompt Novo (Com Endereços)
```
Você é um assistente de planejamento de campanhas OOH.

IMPORTANTE: Responda APENAS com JSON puro, sem texto antes ou depois, sem markdown, sem explicações.

Dados disponíveis:
- Região: Heliópolis, São Paulo/SP
- Quantidade de pontos solicitados: 5
- Endereços disponíveis: [
    {
      "id": "abc-123",
      "endereco": "Rua A",
      "comunidade": "Heliópolis",
      "cidade": "São Paulo",
      "uf": "SP"
    },
    ...
  ]
- Coordenadores e territórios: [
    {
      "id": "coord-1",
      "nome": "João Silva",
      "territorios": {
        "cidades": ["São Paulo"],
        "comunidades": ["Heliópolis", "Paraisópolis"]
      }
    },
    ...
  ]

Tarefa:
1. Escolha o coordenador cujo território melhor cobre a região
2. Selecione exatamente 5 endereços
3. Priorize locais de alto tráfego

Retorne EXATAMENTE neste formato JSON:
{
  "coordenador_id": "uuid do coordenador sugerido",
  "coordenador_nome": "nome do coordenador",
  "endereco_ids": ["uuid1", "uuid2"],
  "justificativa": "motivo da sugestão em uma frase"
}
```

## Vantagens

### 1. Clareza
- Instrução "IMPORTANTE" no topo
- Palavra "EXATAMENTE" no formato esperado
- Sem ambiguidade sobre o que é esperado

### 2. Consistência
- Entrada em JSON → Saída em JSON
- Formato estruturado facilita processamento pela IA

### 3. Concisão
- Menos texto = menos chance de confusão
- Foco no essencial

### 4. Robustez
- Mesmo se a IA adicionar texto, o regex ainda funciona
- Validação em 3 níveis garante tratamento de erros

## Estrutura do Código

```typescript
// 1. Preparar dados estruturados
const enderecosDisponiveis = enderecos?.map((e) => ({
  id: e.id,
  endereco: e.endereco,
  comunidade: e.comunidade,
  cidade: e.cidade,
  uf: e.uf,
})) || [];

const coordenadoresFormatados = coordenadoresData?.map((c: any) => ({
  id: c.id,
  nome: c.nome,
  territorios: c.territorios || { cidades: [], comunidades: [] },
})) || [];

// 2. Montar prompt conciso
const prompt = `Você é um assistente de planejamento de campanhas OOH.

IMPORTANTE: Responda APENAS com JSON puro, sem texto antes ou depois, sem markdown, sem explicações.

Dados disponíveis:
- Região: ${regiaoDescricao}
- Quantidade de pontos solicitados: ${grupo.quantidade}
- Endereços disponíveis: ${JSON.stringify(enderecosDisponiveis, null, 2)}
- Coordenadores e territórios: ${JSON.stringify(coordenadoresFormatados, null, 2)}

Tarefa:
1. Escolha o coordenador cujo território melhor cobre a região
2. Selecione exatamente ${grupo.quantidade} endereços
3. Priorize locais de alto tráfego

Retorne EXATAMENTE neste formato JSON:
{
  "coordenador_id": "uuid do coordenador sugerido",
  "coordenador_nome": "nome do coordenador",
  "endereco_ids": ["uuid1", "uuid2"],
  "justificativa": "motivo da sugestão em uma frase"
}`;

// 3. Chamar IA
const resposta = await askGemini(prompt);

// 4. Extrair e validar JSON (já implementado)
const jsonMatch = resposta.match(/\{[\s\S]*\}/);
// ... validações
```

## Testes Esperados

### Teste 1: Resposta ideal
**Entrada:** Prompt com endereços e coordenadores
**Saída esperada:**
```json
{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva",
  "endereco_ids": ["end-1", "end-2", "end-3"],
  "justificativa": "Coordenador com experiência na região"
}
```
✅ JSON puro, sem texto adicional

### Teste 2: Resposta com texto (fallback)
**Entrada:** Prompt com endereços e coordenadores
**Saída da IA:**
```
Aqui está minha sugestão:
{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva",
  "endereco_ids": ["end-1", "end-2"],
  "justificativa": "Melhor opção"
}
Espero que ajude!
```
✅ Regex extrai JSON corretamente

### Teste 3: Sem endereços
**Entrada:** Prompt sem endereços (região não mapeada)
**Saída esperada:**
```json
{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva",
  "endereco_ids": [],
  "justificativa": "Região não mapeada. Coordenador deverá cadastrar pontos em campo."
}
```
✅ Array vazio de endereços

## Arquivos Modificados

- `src/components/NovaCampanhaModalV2.tsx`
  - Prompt reescrito (mais conciso e claro)
  - Dados estruturados em JSON
  - Instrução "IMPORTANTE" no topo
  - Palavra "EXATAMENTE" no formato

## Status

✅ Prompt otimizado para JSON puro
✅ Dados estruturados em JSON
✅ Instruções claras e concisas
✅ Compatível com validação existente
✅ Pronto para uso
