# Melhorias de UX - Criação de Campanha

## ✅ Melhorias Implementadas

### 1. Seleção Manual de Coordenador com Endereços Automáticos

**Antes**:
- Selecionar coordenador manualmente não buscava endereços
- Usuário tinha que aceitar sem saber se havia endereços disponíveis

**Depois**:
- Ao selecionar coordenador manualmente, o sistema:
  1. Busca endereços disponíveis na região automaticamente
  2. Vincula os endereços encontrados (até a quantidade solicitada)
  3. Mostra toast informando quantos endereços foram vinculados
  4. Se não houver endereços, informa que precisa mapear em campo

**Fluxo**:
```
Usuário seleciona coordenador
  ↓
Sistema busca endereços disponíveis na região
  ↓
Se encontrar endereços:
  → Vincula automaticamente
  → Toast: "5 endereços disponíveis foram vinculados"
  ↓
Se NÃO encontrar endereços:
  → Não vincula nada
  → Toast: "Não há endereços cadastrados. Coordenador deverá mapear em campo"
```

**Código**:
```typescript
const handleSelecionarCoordenador = async (grupoId: string, coordenadorId: string) => {
  // Buscar endereços disponíveis na região
  const { data: enderecos } = await supabase
    .from("enderecos")
    .select("id, endereco, comunidade, cidade, uf")
    .eq("status", "disponivel")
    .eq("uf", grupo.uf)
    .eq("cidade", grupo.cidade)
    .limit(grupo.quantidade * 2);

  const temEnderecos = enderecos && enderecos.length > 0;
  const enderecosIds = temEnderecos 
    ? enderecos.slice(0, grupo.quantidade).map((e) => e.id)
    : [];

  // Atualizar grupo com coordenador e endereços
  setGrupos(grupos.map((g) =>
    g.id === grupoId
      ? {
          ...g,
          coordenador_id: coordenadorId,
          coordenador_nome: coordenador?.nome,
          endereco_ids: enderecosIds,
        }
      : g
  ));

  // Mostrar mensagem apropriada
  if (temEnderecos) {
    toast({
      title: "Coordenador selecionado",
      description: `${enderecosIds.length} endereços disponíveis foram vinculados.`,
    });
  } else {
    toast({
      title: "Coordenador selecionado",
      description: "Não há endereços cadastrados nesta região. O coordenador deverá mapear em campo.",
    });
  }
};
```

---

### 2. Melhor Tratamento de Erro da IA

**Antes**:
- Erro genérico: "A IA não retornou uma resposta no formato esperado"
- Sem logs para debug

**Depois**:
- Logs detalhados no console para debug
- Tenta remover markdown da resposta antes de parsear
- Mensagens de erro mais claras

**Logs adicionados**:
```typescript
console.log("🤖 [IA] Resposta bruta:", resposta);
console.log("📝 [IA] JSON extraído:", jsonMatch[0]);
console.log("✅ [IA] JSON parseado:", sugestao);
console.error("❌ [IA] Erro ao parsear JSON:", parseError);
```

**Tratamento de markdown**:
```typescript
// Se não encontrou JSON, tentar remover markdown
if (!jsonMatch) {
  const semMarkdown = resposta.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  jsonMatch = semMarkdown.match(/\{[\s\S]*\}/);
}
```

---

### 3. Exibição Compacta de Territórios (Implementado Anteriormente)

**Antes**:
- Mostrava todos os badges de territórios
- Ocupava muito espaço na tabela

**Depois**:
- Mostra apenas o primeiro território + contador
- Exemplo: 🟢 Cantinho Do Céu | +1

---

## 🧪 Como Testar

### Teste 1: Seleção Manual com Endereços Disponíveis

1. Criar nova campanha
2. Adicionar grupo: SP → São Paulo → Brasilândia → 5 pontos
3. **NÃO clicar em "Sugerir com IA"**
4. Selecionar coordenador manualmente no dropdown
5. Verificar toast: "5 endereços disponíveis foram vinculados"
6. Verificar badge: "5 endereços vinculados"

### Teste 2: Seleção Manual sem Endereços

1. Criar nova campanha
2. Adicionar grupo: SP → Cidade Nova (sem endereços) → 5 pontos
3. Selecionar coordenador manualmente
4. Verificar toast: "Não há endereços cadastrados. Coordenador deverá mapear em campo"
5. Verificar badge: "Mapear em campo"

### Teste 3: IA com Logs de Debug

1. Criar nova campanha
2. Adicionar grupo com território
3. Clicar em "Sugerir com IA"
4. Abrir console (F12)
5. Verificar logs:
   ```
   🤖 [IA] Resposta bruta: {...}
   📝 [IA] JSON extraído: {...}
   ✅ [IA] JSON parseado: {...}
   ```
6. Se der erro, verificar mensagem no console

---

## 📊 Comparação

### Seleção Manual

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Busca endereços | ❌ Não | ✅ Sim, automático |
| Informa disponibilidade | ❌ Não | ✅ Sim, via toast |
| Vincula endereços | ❌ Não | ✅ Sim, automático |
| Mensagem se não houver | ❌ Não | ✅ Sim, clara |

### IA

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Logs de debug | ❌ Não | ✅ Sim, detalhados |
| Remove markdown | ❌ Não | ✅ Sim |
| Mensagem de erro | ⚠️ Genérica | ✅ Clara |

---

## 🐛 Troubleshooting

### Erro: "A IA não retornou uma resposta no formato esperado"

**Verificar no console**:
1. `🤖 [IA] Resposta bruta:` - Ver o que a IA retornou
2. Se tiver markdown (```json), o código remove automaticamente
3. Se não tiver JSON válido, a IA falhou

**Possíveis causas**:
- API Key do Gemini inválida
- Limite de rate da API atingido
- Prompt muito longo
- Resposta da IA não seguiu o formato

**Solução**:
- Verificar API Key no `.env`
- Aguardar alguns minutos (rate limit)
- Simplificar o prompt
- Tentar novamente

### Coordenador selecionado mas não vinculou endereços

**Verificar**:
1. Se há endereços cadastrados na região
2. Se os endereços estão com status "disponivel"
3. Se a UF e cidade estão corretas

**Query para verificar**:
```sql
SELECT id, endereco, comunidade, cidade, uf, status
FROM enderecos
WHERE uf = 'SP' 
  AND cidade = 'São Paulo'
  AND comunidade = 'Brasilândia'
  AND status = 'disponivel';
```

---

## 🎯 Próximos Passos

Possíveis melhorias futuras:

1. **Modal de seleção de endereços**
   - Mostrar lista de endereços disponíveis
   - Permitir selecionar manualmente quais vincular
   - Mostrar no mapa

2. **Filtros avançados**
   - Filtrar por tipo de local (rua, praça, etc)
   - Filtrar por tráfego estimado
   - Ordenar por relevância

3. **Sugestões múltiplas da IA**
   - IA retorna 3 opções
   - Usuário escolhe a melhor
   - Comparação lado a lado

4. **Histórico de campanhas**
   - Ver campanhas anteriores na região
   - Reutilizar configurações
   - Copiar endereços

---

**Data**: 25 de fevereiro de 2026
**Versão**: 4.0 - Melhorias de UX
