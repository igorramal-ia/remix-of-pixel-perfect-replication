# 🧪 Testes Consolidados - Executar Após Todas as Implementações

## 📅 Data: 01/03/2026

---

## ✅ Migrations Aplicadas

- [x] Prioridade Máxima: Cache e Geocoding
- [x] Prioridade Alta: Coluna `ativo` em endereços (663 endereços ativos)
- [ ] Prioridade Média: Histórico de mudanças (aguardando implementação)

---

## 🧪 BLOCO 1: Prioridade Máxima - Cache e Geocoding

### 1.1 Cache e Atualização Automática

- [ ] **Criar Campanha**
  - Criar nova campanha
  - ✅ Verificar se aparece na lista SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Ativar Instalação**
  - Abrir detalhes da campanha
  - Ativar uma instalação
  - ✅ Verificar se status muda instantaneamente (sem F5)
  - Status: ⏳ Pendente

- [ ] **Finalizar Instalação**
  - Finalizar uma instalação ativa
  - ✅ Verificar se status muda para finalizada (sem F5)
  - ✅ Verificar se endereço fica disponível
  - Status: ⏳ Pendente

- [ ] **Adicionar Pontos**
  - Adicionar novos pontos à campanha
  - ✅ Verificar se aparecem na lista SEM dar F5
  - Status: ⏳ Pendente

### 1.2 Geocoding Automático

- [ ] **Criar Endereço com Geocoding**
  - Criar novo endereço: "Avenida Paulista, 1578, São Paulo, SP"
  - ✅ Verificar no console: "🗺️ Buscando coordenadas..."
  - Aguardar 2-3 segundos
  - ✅ Verificar no console: "✅ Coordenadas encontradas"
  - Recarregar página (F5)
  - ✅ Verificar se latitude e longitude estão preenchidas
  - Status: ⏳ Pendente

- [ ] **Verificar no Banco**
  ```sql
  SELECT endereco, cidade, uf, latitude, longitude
  FROM enderecos
  WHERE latitude IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 5;
  ```
  - ✅ Verificar se coordenadas foram salvas
  - Status: ⏳ Pendente

---

## 🧪 BLOCO 2: Prioridade Alta - Sugestão, Adicionar e Excluir

### 2.1 Sugestão Inteligente de Endereços

- [ ] **Criar Campanha com Sugestão**
  - Criar nova campanha
  - Abrir modal "Adicionar Pontos"
  - ✅ Verificar se apenas endereços disponíveis são listados
  - ✅ Verificar se endereços ocupados NÃO aparecem
  - Status: ⏳ Pendente

- [ ] **Verificar Regra de 2 Dias**
  - Finalizar uma instalação hoje
  - Criar nova campanha no mesmo dia
  - ✅ Verificar se endereço NÃO é sugerido (< 2 dias)
  - Status: ⏳ Pendente (teste manual ou simular no banco)

### 2.2 Adicionar Pontos na Campanha

- [ ] **Botão Habilitado**
  - Abrir detalhes da campanha
  - ✅ Verificar se botão "Adicionar Pontos" está habilitado
  - Status: ⏳ Pendente

- [ ] **Adicionar Endereços Existentes**
  - Clicar em "Adicionar Pontos"
  - Aba "Endereços Existentes"
  - Selecionar 2-3 endereços disponíveis
  - Clicar "Adicionar"
  - ✅ Verificar se instalações são criadas (status: pendente)
  - ✅ Verificar se aparecem na lista SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Criar Novo Endereço via Modal**
  - Clicar em "Adicionar Pontos"
  - Aba "Criar Novo"
  - Preencher dados:
    - UF: SP
    - Cidade: São Paulo
    - Comunidade: Teste
    - Endereço: Rua Teste, 123
  - Clicar "Criar e Adicionar"
  - ✅ Verificar se endereço é criado
  - ✅ Verificar se instalação é criada
  - ✅ Verificar se coordenadas são buscadas automaticamente
  - ✅ Verificar se aparece na campanha SEM dar F5
  - Status: ⏳ Pendente

### 2.3 Excluir Endereço

- [ ] **Excluir Endereço Disponível**
  - Ir para Inventário
  - Selecionar endereço sem instalações ativas
  - Clicar no menu (⋮)
  - Clicar "Excluir Endereço"
  - Confirmar
  - ✅ Verificar se endereço some da lista SEM dar F5
  - Status: ⏳ Pendente

- [ ] **Tentar Excluir Endereço Ocupado**
  - Selecionar endereço com instalação ativa
  - Clicar no menu (⋮)
  - Clicar "Excluir Endereço"
  - ✅ Verificar mensagem de erro: "Não é possível excluir endereço com instalações ativas"
  - ✅ Verificar que endereço NÃO foi excluído
  - Status: ⏳ Pendente

- [ ] **Verificar Soft Delete no Banco**
  ```sql
  SELECT endereco, ativo
  FROM enderecos
  WHERE ativo = false
  ORDER BY updated_at DESC
  LIMIT 5;
  ```
  - ✅ Verificar se endereços excluídos têm `ativo = false`
  - Status: ⏳ Pendente

---

## 🧪 BLOCO 3: Relatórios (Já Implementado)

### 3.1 Gerar Relatório

- [ ] **Gerar Relatório Completo**
  - Selecionar campanha com instalações ativas
  - Clicar "Gerar Relatório"
  - Preencher informações
  - Gerar
  - ✅ Verificar se fotos aparecem (signed URLs)
  - ✅ Verificar se coordenadas aparecem
  - ✅ Verificar se design está limpo (fundo branco)
  - Status: ⏳ Pendente

- [ ] **Verificar Estrutura do Relatório**
  - Slide 1: Capa com PI, cliente, nome da campanha
  - Slides 2+: Fotos por endereço (1 endereço = 1 slide)
  - ✅ Verificar se coordenadas aparecem: "📍 Coordenadas: -23.550520, -46.633309"
  - ✅ Verificar se data aparece em cada foto
  - Status: ⏳ Pendente

---

## 🧪 BLOCO 4: Prioridade Média - Relatório de Mudanças (Aguardando Implementação)

### 4.1 Substituir Endereço com Motivo

- [ ] **Substituir Endereço**
  - Abrir campanha com instalação ativa
  - Clicar "Substituir" em uma instalação
  - Preencher motivo da substituição
  - Selecionar novo endereço
  - Confirmar
  - ✅ Verificar se substituição foi registrada
  - ✅ Verificar se motivo foi salvo
  - Status: ⏳ Aguardando implementação

### 4.2 Visualizar Histórico de Mudanças

- [ ] **Acessar Relatório de Mudanças**
  - Ir para página "Relatório de Mudanças"
  - ✅ Verificar se lista todas as substituições
  - ✅ Verificar se mostra: data, campanha, endereço antigo, endereço novo, motivo
  - Status: ⏳ Aguardando implementação

- [ ] **Filtrar Histórico**
  - Filtrar por campanha
  - Filtrar por data
  - ✅ Verificar se filtros funcionam
  - Status: ⏳ Aguardando implementação

---

## 📊 Resumo de Testes

### Por Prioridade
- **Prioridade Máxima**: 6 testes
- **Prioridade Alta**: 8 testes
- **Relatórios**: 2 testes
- **Prioridade Média**: 3 testes (aguardando implementação)

### Total Geral
- Total de testes: 19
- Concluídos: 0
- Pendentes: 16
- Aguardando implementação: 3
- Falharam: 0

---

## 🐛 Bugs Encontrados

(Adicionar aqui qualquer bug encontrado durante os testes)

### Exemplo de Formato:
```
BUG #1: [Título do Bug]
- Descrição: [O que aconteceu]
- Passos para reproduzir: [Como reproduzir]
- Comportamento esperado: [O que deveria acontecer]
- Comportamento atual: [O que está acontecendo]
- Prioridade: [Alta/Média/Baixa]
- Status: [Aberto/Em correção/Resolvido]
```

---

## ✅ Aprovação Final

- [ ] Todos os testes do Bloco 1 passaram
- [ ] Todos os testes do Bloco 2 passaram
- [ ] Todos os testes do Bloco 3 passaram
- [ ] Todos os testes do Bloco 4 passaram
- [ ] Nenhum bug crítico encontrado
- [ ] Sistema pronto para produção

---

## 📝 Ordem de Execução Recomendada

### Sessão 1: Cache e Geocoding (15 min)
1. Teste 1.1: Cache (criar, ativar, finalizar, adicionar)
2. Teste 1.2: Geocoding (criar endereço e verificar coordenadas)

### Sessão 2: Sugestão e Adicionar (20 min)
1. Teste 2.1: Sugestão inteligente
2. Teste 2.2: Adicionar pontos (existentes e novo)

### Sessão 3: Excluir e Relatórios (15 min)
1. Teste 2.3: Excluir endereço
2. Teste 3.1: Gerar relatório

### Sessão 4: Histórico de Mudanças (10 min)
1. Teste 4.1: Substituir com motivo
2. Teste 4.2: Visualizar histórico

**Tempo total estimado**: 60 minutos

---

## 📋 Checklist Pré-Teste

Antes de iniciar os testes, verificar:

- [x] Migration de prioridade máxima aplicada
- [x] Migration de prioridade alta aplicada (663 endereços ativos)
- [ ] Migration de prioridade média aplicada (aguardando implementação)
- [ ] Código atualizado no ambiente de teste
- [ ] Google Maps API Key configurada
- [ ] Supabase conectado e funcionando
- [ ] Bucket de fotos configurado
- [ ] Bucket de relatórios configurado

---

**Documento criado em**: 01/03/2026  
**Última atualização**: 01/03/2026  
**Status**: 📋 Aguardando execução dos testes após implementação completa

