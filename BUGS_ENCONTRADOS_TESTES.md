# 🐛 Bugs Encontrados nos Testes - 01/03/2026

## 1. ❌ Cache não atualiza automaticamente
**Descrição**: Após ativar instalação, precisou mudar de página para ver a atualização.

**Comportamento esperado**: Atualizar automaticamente sem precisar mudar de página.

**Causa provável**: Query não está sendo invalidada corretamente ou componente não está re-renderizando.

**Prioridade**: Alta

---

## 2. ❌ Fotos corrompidas no modal de ativação
**Descrição**: Fotos aparecem corrompidas no modal de ativar instalação.

**Comportamento esperado**: Fotos devem aparecer corretamente.

**Causa provável**: URLs não estão sendo convertidas para signed URLs.

**Prioridade**: Alta

---

## 3. ❌ Mapa não mostra status de ocupação
**Descrição**: No mapa, não está diferenciando endereços ocupados dos disponíveis.

**Comportamento esperado**: 
- 🟢 Verde: Disponível
- 🔴 Vermelho: Ocupado
- 🟡 Amarelo: Em transição

**Causa provável**: Lógica de status não implementada no componente do mapa.

**Prioridade**: Média

---

## 4. ❌ Falta filtro no mapa
**Descrição**: Não há filtros para mostrar apenas ativos, ocupados, etc.

**Comportamento esperado**: Filtros para:
- Todos
- Disponíveis
- Ocupados
- Inativos

**Prioridade**: Média

---

## 📊 Resumo
- Total de bugs: 4
- Prioridade Alta: 2
- Prioridade Média: 2

---

## 🔧 Ordem de Correção
1. Cache não atualiza (Alta)
2. Fotos corrompidas (Alta)
3. Status no mapa (Média)
4. Filtros no mapa (Média)

