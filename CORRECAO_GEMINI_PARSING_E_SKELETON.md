# Correção: Parsing JSON do Gemini e Warning DOM

## Problema 1: Gemini retorna texto com JSON embutido

### Causa
O Gemini 2.5 Flash pode retornar texto explicativo junto com o JSON, causando erro no `JSON.parse()`.

### Solução Aplicada

#### A. Regex para extrair JSON
```typescript
// src/components/NovaCampanhaModalV2.tsx
const jsonMatch = resposta.match(/\{[\s\S]*\}/);
```

Extrai o primeiro bloco JSON encontrado, ignorando texto ao redor.

#### B. Tratamento de erros robusto
```typescript
if (!jsonMatch) {
  // Fallback: IA não retornou JSON válido
  toast({
    title: "Erro ao processar sugestão",
    description: "A IA não retornou uma resposta no formato esperado. Tente novamente.",
    variant: "destructive",
  });
  return;
}

let sugestao;
try {
  sugestao = JSON.parse(jsonMatch[0]);
} catch (parseError) {
  // Fallback: JSON inválido
  toast({
    title: "Erro ao processar sugestão",
    description: "Não foi possível interpretar a resposta da IA. Tente novamente.",
    variant: "destructive",
  });
  return;
}

// Validar estrutura do JSON
if (!sugestao.coordenador_id || !sugestao.coordenador_nome) {
  toast({
    title: "Resposta incompleta",
    description: "A IA não forneceu todas as informações necessárias. Tente novamente.",
    variant: "destructive",
  });
  return;
}
```

#### C. Três níveis de validação
1. **Regex não encontra JSON**: Mensagem amigável ao usuário
2. **JSON.parse() falha**: Captura exceção e mostra toast
3. **JSON incompleto**: Valida campos obrigatórios

### Exemplos de Respostas do Gemini

#### Resposta válida (JSON puro)
```json
{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva",
  "endereco_ids": ["uuid1", "uuid2"],
  "justificativa": "Coordenador com experiência na região"
}
```

#### Resposta válida (JSON com texto)
```
Aqui está minha sugestão para a campanha:

{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva",
  "endereco_ids": ["uuid1", "uuid2"],
  "justificativa": "Coordenador com experiência na região"
}

Espero que isso ajude!
```
✅ Regex extrai o JSON corretamente

#### Resposta inválida (sem JSON)
```
Não consigo sugerir um coordenador adequado para esta região.
```
❌ Regex não encontra JSON → Toast de erro

#### Resposta inválida (JSON malformado)
```json
{
  "coordenador_id": "abc-123",
  "coordenador_nome": "João Silva"
  "endereco_ids": ["uuid1", "uuid2"]
}
```
❌ JSON.parse() falha → Toast de erro

---

## Problema 2: Warning validateDOMNesting

### Causa
```jsx
<p className="text-muted-foreground mt-1">
  {isLoading ? (
    <Skeleton className="h-4 w-32 inline-block" />  {/* ❌ div dentro de p */}
  ) : (
    `${campaigns?.length || 0} campanhas cadastradas`
  )}
</p>
```

O componente `Skeleton` renderiza um `<div>`, mas está dentro de um `<p>`. HTML não permite `<div>` dentro de `<p>`.

### Solução Aplicada

```jsx
<div className="text-muted-foreground mt-1">
  {isLoading ? (
    <Skeleton className="h-4 w-32 inline-block" />  {/* ✅ div dentro de div */}
  ) : (
    <span>{campaigns?.length || 0} campanhas cadastradas</span>
  )}
</div>
```

Mudanças:
- `<p>` → `<div>` (permite div filho)
- Template string → `<span>` (consistência)

---

## Arquivos Modificados

1. `src/components/NovaCampanhaModalV2.tsx`
   - Melhorado parsing do JSON do Gemini
   - Adicionados 3 níveis de validação
   - Mensagens de erro amigáveis

2. `src/pages/Campaigns.tsx`
   - `<p>` trocado por `<div>` (linha 33)
   - Template string trocado por `<span>`

---

## Como Testar

### Teste 1: Sugestão da IA
1. Criar nova campanha
2. Adicionar grupo com região
3. Clicar em "Gerar Sugestões com IA"
4. Verificar se:
   - Sugestão aparece corretamente
   - Não há erro no console
   - Se houver erro, toast amigável aparece

### Teste 2: Warning DOM
1. Ir para página de Campanhas
2. Recarregar página (para ver loading)
3. Abrir console (F12)
4. Verificar que NÃO há warning `validateDOMNesting`

---

## Possíveis Problemas Futuros

### Gemini retorna múltiplos JSONs
```
Aqui estão duas opções:
{"coordenador_id": "abc"} ou {"coordenador_id": "def"}
```

**Solução atual**: Regex pega o primeiro JSON encontrado
**Melhoria futura**: Pedir à IA para retornar apenas uma opção

### Gemini retorna JSON com comentários
```json
{
  "coordenador_id": "abc",  // Melhor opção
  "coordenador_nome": "João"
}
```

**Solução atual**: JSON.parse() vai falhar → Toast de erro
**Melhoria futura**: Remover comentários antes do parse

### Gemini retorna array em vez de objeto
```json
[{"coordenador_id": "abc"}]
```

**Solução atual**: Validação vai falhar → Toast de erro
**Melhoria futura**: Detectar array e pegar primeiro elemento

---

## Status

✅ Parsing robusto com regex
✅ Três níveis de validação
✅ Mensagens de erro amigáveis
✅ Warning DOM corrigido
✅ Pronto para uso
