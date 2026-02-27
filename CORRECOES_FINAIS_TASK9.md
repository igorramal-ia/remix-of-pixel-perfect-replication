# Correções Finais - Task 9: IA Gemini e Avisos de Endereços Faltantes

## Problemas Identificados

### 1. IA inventando coordenadores falsos
- IA retornava IDs inexistentes: `a1b2c3d4-e5f6-7890-1234-567890abcdef`
- Coordenadores não existiam no banco de dados

### 2. Resposta sendo cortada
- `finishReason: 'MAX_TOKENS'` mesmo com 2048 tokens
- JSON ficava incompleto

### 3. Falta de aviso sobre endereços insuficientes
- Usuário solicitou 10 pontos, sistema encontrou apenas 9
- Não havia indicação clara de que faltavam endereços

---

## Correções Aplicadas

### 1. Validação de Coordenador + Fallback
**Arquivo**: `src/components/NovaCampanhaModalV2.tsx`

```typescript
// Validar se coordenador_id existe na lista de coordenadores reais
const coordenadorValido = coordenadoresFormatados.find(
  (c: any) => c.id === sugestao.coordenador_id
);

if (!coordenadorValido) {
  // Fallback: usar primeiro coordenador da lista filtrada
  const coordenadoresFiltrados = coordenadoresFormatados.filter((c: any) => {
    if (grupo.comunidade) {
      return c.comunidades.includes(grupo.comunidade);
    }
    return c.comunidades.length > 0;
  });

  if (coordenadoresFiltrados.length > 0) {
    sugestao.coordenador_id = coordenadoresFiltrados[0].id;
    sugestao.coordenador_nome = coordenadoresFiltrados[0].nome;
  }
}
```

### 2. Prompt Ultra-Conciso
**Arquivo**: `src/components/NovaCampanhaModalV2.tsx`

Antes (verbose):
```
Responda APENAS com JSON puro.

Região: Capão Redondo, São Paulo/SP
Pontos: 10

Coordenadores disponíveis:
- ID: 129fb2d1-d322-48ce-9275-a29f01, Nome: Arlindo, Comunidades: Capão Redondo, ...
```

Depois (conciso):
```
JSON puro. Região: Capão Redondo, São Paulo/SP. Pontos: 10.
Coordenadores (use ID exato):
129fb2d1-d322-48ce-9275-a29f01|Arlindo
Endereços: id1,id2,id3
{"coordenador_id":"ID_EXATO","coordenador_nome":"NOME","endereco_ids":["id1"],"justificativa":"curta"}
```

### 3. Configuração Gemini Otimizada
**Arquivo**: `src/services/gemini.ts`

```typescript
generationConfig: {
  temperature: 0.3,  // Reduzido de 0.7 para respostas mais diretas
  topK: 20,          // Reduzido de 40
  topP: 0.8,         // Reduzido de 0.95
  maxOutputTokens: 1024, // Voltou para 1024 (prompt mais conciso)
}
```

### 4. Filtro de Coordenadores Antes do Prompt
**Arquivo**: `src/components/NovaCampanhaModalV2.tsx`

```typescript
// Filtrar coordenadores que cobrem a região
const coordenadoresFiltrados = coordenadoresFormatados.filter((c: any) => {
  if (grupo.comunidade) {
    return c.comunidades.includes(grupo.comunidade);
  }
  return c.comunidades.length > 0;
});

// Enviar apenas 3 primeiros para a IA (reduzir tokens)
${coordenadoresFiltrados.slice(0, 3).map((c: any) => `${c.id}|${c.nome}`).join('\n')}
```

### 5. Avisos de Endereços Faltantes

#### Na Etapa 2 (Configuração)
**Arquivo**: `src/components/NovaCampanhaModalV2.tsx`

```typescript
{grupo.endereco_ids.length > 0 ? (
  <>
    <Badge variant="outline">
      {grupo.endereco_ids.length} endereços vinculados
    </Badge>
    {grupo.endereco_ids.length < grupo.quantidade && (
      <Badge variant="destructive">
        Faltam {grupo.quantidade - grupo.endereco_ids.length} pontos - mapear em campo
      </Badge>
    )}
  </>
) : (
  <Badge variant="outline">Mapear {grupo.quantidade} pontos em campo</Badge>
)}
```

#### Na Etapa 3 (Revisão)
```typescript
{grupo.endereco_ids.length > 0 ? (
  <>
    <p className="text-xs text-muted-foreground">
      {grupo.endereco_ids.length} endereços vinculados
    </p>
    {grupo.endereco_ids.length < grupo.quantidade && (
      <p className="text-xs text-destructive font-medium">
        ⚠️ Faltam {grupo.quantidade - grupo.endereco_ids.length} pontos - mapear em campo
      </p>
    )}
  </>
) : (
  <p className="text-xs text-muted-foreground italic">
    {grupo.quantidade} endereços serão mapeados em campo
  </p>
)}
```

#### Na Notificação ao Coordenador
```typescript
const faltamPontos = grupo.quantidade - grupo.endereco_ids.length;

if (grupo.endereco_ids.length === 0) {
  mensagemNotificacao = `... Você deverá mapear e cadastrar ${grupo.quantidade} pontos durante o trabalho de campo. ...`;
} else if (faltamPontos > 0) {
  mensagemNotificacao = `... ${grupo.endereco_ids.length} pontos já atribuídos. ATENÇÃO: Faltam ${faltamPontos} pontos que deverão ser mapeados em campo. ...`;
} else {
  mensagemNotificacao = `... ${grupo.endereco_ids.length} pontos atribuídos. ...`;
}
```

---

## Resultado Esperado

### Antes
- IA inventava coordenadores: `a1b2c3d4-e5f6-7890-1234-567890abcdef`
- Resposta cortada: `finishReason: 'MAX_TOKENS'`
- Usuário não sabia que faltavam endereços

### Depois
- IA usa IDs reais ou fallback automático
- Resposta completa (prompt conciso + 1024 tokens suficientes)
- Avisos claros em 3 lugares:
  - Badge vermelho na Etapa 2: "Faltam X pontos - mapear em campo"
  - Texto vermelho na Etapa 3: "⚠️ Faltam X pontos - mapear em campo"
  - Notificação ao coordenador: "ATENÇÃO: Faltam X pontos..."

---

## Como Testar

1. Criar nova campanha
2. Adicionar grupo com 10 pontos em região com apenas 9 endereços
3. Clicar em "Sugerir com IA"
4. Verificar:
   - ✅ IA retorna coordenador válido (ou fallback)
   - ✅ JSON completo (sem corte)
   - ✅ Badge vermelho mostra "Faltam 1 pontos - mapear em campo"
   - ✅ Etapa 3 mostra aviso em vermelho
   - ✅ Notificação menciona "Faltam 1 pontos"

---

## Arquivos Modificados

- `src/services/gemini.ts` - Configuração otimizada
- `src/components/NovaCampanhaModalV2.tsx` - Validação, prompt, avisos

---

## Status

✅ **CONCLUÍDO** - Todas as correções aplicadas e prontas para teste
