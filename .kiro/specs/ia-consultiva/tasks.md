# Tarefas: IA Consultiva

## 1. Setup e Estrutura Base
- [x] 1.1 Criar tipos TypeScript (`src/types/iaConsultiva.ts`)
- [x] 1.2 Criar estrutura de pastas (components, services, hooks)

## 2. Serviços Core
- [x] 2.1 Implementar Question Interpreter (`src/services/questionInterpreter.ts`)
  - [x] 2.1.1 Criar padrões regex para relatórios
  - [x] 2.1.2 Criar padrões regex para campanhas
  - [x] 2.1.3 Criar padrões regex para endereços
  - [x] 2.1.4 Criar padrões regex para instalações
  - [x] 2.1.5 Implementar extração de filtros (período, estado, cidade)
  - [x] 2.1.6 Implementar cálculo de confidence
- [x] 2.2 Implementar Query Executor (`src/services/queryExecutor.ts`)
  - [x] 2.2.1 Criar query para contar relatórios
  - [x] 2.2.2 Criar query para contar campanhas
  - [x] 2.2.3 Criar query para contar endereços
  - [x] 2.2.4 Criar query para contar instalações
  - [x] 2.2.5 Criar query para ranking de campanhas
  - [x] 2.2.6 Criar query para estatísticas gerais
  - [x] 2.2.7 Implementar tratamento de erros
- [x] 2.3 Implementar Response Formatter (`src/services/responseFormatter.ts`)
  - [x] 2.3.1 Criar templates para relatórios
  - [x] 2.3.2 Criar templates para campanhas
  - [x] 2.3.3 Criar templates para endereços
  - [x] 2.3.4 Criar templates para instalações
  - [x] 2.3.5 Implementar formatação de números
  - [x] 2.3.6 Implementar formatação de datas
  - [x] 2.3.7 Implementar geração de sugestões

## 3. Componentes UI
- [x] 3.1 Criar MessageBubble component (`src/components/MessageBubble.tsx`)
  - [x] 3.1.1 Estilo para mensagem do usuário
  - [x] 3.1.2 Estilo para mensagem do assistente
  - [x] 3.1.3 Timestamp formatado
- [x] 3.2 Criar TypingIndicator component (`src/components/TypingIndicator.tsx`)
  - [x] 3.2.1 Animação de "digitando..."
- [x] 3.3 Criar SuggestedQuestions component (`src/components/SuggestedQuestions.tsx`)
  - [x] 3.3.1 Lista de perguntas sugeridas por categoria
  - [x] 3.3.2 Click handler para preencher input
  - [x] 3.3.3 Organização por categorias (Relatórios, Campanhas, etc)
- [ ] 3.4 Criar ChatInterface component (`src/components/ChatInterface.tsx`)
  - [ ] 3.4.1 Input field com Enter para enviar
  - [ ] 3.4.2 Botão de enviar
  - [ ] 3.4.3 Lista de mensagens com scroll automático
  - [ ] 3.4.4 Botão para limpar histórico
  - [ ] 3.4.5 Integração com SuggestedQuestions
  - [ ] 3.4.6 Integração com TypingIndicator

## 4. Hook Principal
- [x] 4.1 Criar useIAConsultiva hook (`src/hooks/useIAConsultiva.ts`)
  - [x] 4.1.1 Estado de mensagens
  - [x] 4.1.2 Estado de loading
  - [x] 4.1.3 Função sendMessage
  - [x] 4.1.4 Função clearHistory
  - [x] 4.1.5 Integração com questionInterpreter
  - [x] 4.1.6 Integração com queryExecutor
  - [x] 4.1.7 Integração com responseFormatter
  - [x] 4.1.8 Tratamento de erros

## 5. Página Principal
- [x] 5.1 Criar IAConsultivaPage (`src/pages/IAConsultivaPage.tsx`)
  - [x] 5.1.1 Layout responsivo
  - [x] 5.1.2 Header com título e descrição
  - [x] 5.1.3 Integração com ChatInterface
  - [x] 5.1.4 Estado inicial com mensagem de boas-vindas
- [x] 5.2 Atualizar rota no App.tsx
- [ ] 5.3 Atualizar navegação (se necessário)

## 6. Otimizações
- [ ] 6.1 Implementar debounce no input (300ms)
- [ ] 6.2 Adicionar React Query para cache de queries
- [x] 6.3 Implementar scroll automático para última mensagem
- [x] 6.4 Adicionar loading states apropriados

## 7. Testes e Validação
- [ ] 7.1 Testar interpretação de perguntas
  - [ ] 7.1.1 Perguntas sobre relatórios
  - [ ] 7.1.2 Perguntas sobre campanhas
  - [ ] 7.1.3 Perguntas sobre endereços
  - [ ] 7.1.4 Perguntas sobre instalações
  - [ ] 7.1.5 Perguntas com filtros de período
  - [ ] 7.1.6 Perguntas com filtros geográficos
- [ ] 7.2 Testar queries no banco
  - [ ] 7.2.1 Queries com dados reais
  - [ ] 7.2.2 Queries com filtros
  - [ ] 7.2.3 Queries sem resultados
- [ ] 7.3 Testar formatação de respostas
  - [ ] 7.3.1 Números grandes
  - [ ] 7.3.2 Datas em português
  - [ ] 7.3.3 Respostas vazias
- [ ] 7.4 Testar performance
  - [ ] 7.4.1 Tempo de resposta < 2s
  - [ ] 7.4.2 Múltiplas perguntas seguidas
- [ ] 7.5 Testar em diferentes roles
  - [ ] 7.5.1 Admin
  - [ ] 7.5.2 Coordenador
  - [ ] 7.5.3 Operações

## 8. Documentação
- [ ] 8.1 Adicionar comentários no código
- [ ] 8.2 Criar README com exemplos de perguntas
- [ ] 8.3 Documentar como adicionar novos tipos de pergunta

## 9. Polimento Final
- [ ] 9.1 Ajustar estilos e responsividade
- [ ] 9.2 Adicionar animações suaves
- [ ] 9.3 Testar acessibilidade (teclado, screen readers)
- [ ] 9.4 Verificar consistência com design system
