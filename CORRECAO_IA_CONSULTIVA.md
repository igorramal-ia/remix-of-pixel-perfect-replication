# Correção: IA Consultiva - Respostas Incorretas

## Problemas Identificados

### 1. Endereços Disponíveis
**Problema:** Pergunta "Quantos endereços estão disponíveis?" retornava total de endereços cadastrados (664) em vez de apenas os disponíveis.

**Causa:** A query não estava filtrando corretamente os endereços com base no status de instalações.

**Solução:**
- Reescrita da lógica de contagem de endereços disponíveis/ocupados
- Busca todos os endereços ativos
- Busca instalações com status 'ativa' ou 'pendente'
- Calcula disponíveis = total - ocupados
- Adicionado tratamento de erros adequado

### 2. Filtro de Estado (UF)
**Problema:** Pergunta "Quantos endereços existem em SP?" não capturava o estado corretamente.

**Causa:** Regex de estado exigia preposição obrigatória e não funcionava com "em SP?" (com interrogação).

**Solução:**
- Regex atualizado de `/(?:em|no|do)\s+([A-Z]{2})\b/i` para `/(?:em|no|do|de)?\s*([A-Z]{2})(?:\s|$|\?|!|\.)/i`
- Agora aceita:
  - Com preposição: "em SP", "no RJ", "do MG"
  - Sem preposição: "SP", "RJ", "MG"
  - Com pontuação: "SP?", "SP!", "SP."

## Melhorias Adicionadas

### Logs de Debug
Adicionados logs em console para facilitar debugging:

**questionInterpreter.ts:**
```typescript
console.log("🔍 Interpretando pergunta:", question);
console.log("📊 Filtros extraídos:", filters);
console.log("✅ Intent identificado:", result);
```

**queryExecutor.ts:**
```typescript
console.log("🔧 Executando query:", { type, action, filters });
console.log("📊 Endereços - Total:", todosEnderecos.length, "Ocupados:", enderecosOcupados.size);
console.log("📊 Endereços (sem filtro status) - Count:", count, "Estado:", filters.estado);
```

## Testes Recomendados

Após as correções, testar as seguintes perguntas:

### Endereços
- ✅ "Quantos endereços estão disponíveis?"
- ✅ "Quantos endereços estão ocupados?"
- ✅ "Quantos endereços existem em SP?"
- ✅ "Quantos endereços existem em MG?"
- ✅ "Quantos endereços em RJ?"
- ✅ "Quantos endereços SP?" (sem preposição)

### Campanhas
- "Quantas campanhas ativas existem?"
- "Quantas campanhas foram finalizadas?"
- "Qual campanha tem mais instalações?"

### Instalações
- "Quantas instalações ativas existem?"
- "Quantas instalações estão pendentes?"
- "Quantas instalações foram finalizadas?"

### Relatórios
- "Quantos relatórios foram gerados?"
- "Quantos relatórios foram gerados no último mês?"

### Estatísticas
- "Mostre estatísticas gerais do sistema"

## Arquivos Modificados

1. `src/services/questionInterpreter.ts`
   - Melhorado regex de estado
   - Adicionados logs de debug

2. `src/services/queryExecutor.ts`
   - Corrigida lógica de contagem de endereços disponíveis/ocupados
   - Adicionados logs de debug
   - Melhorado tratamento de erros

## Próximos Passos

1. Testar todas as perguntas sugeridas
2. Verificar logs no console do navegador
3. Se necessário, ajustar confidence scores
4. Adicionar mais padrões de perguntas conforme necessário
5. Remover logs de debug após validação (ou manter apenas em modo desenvolvimento)
