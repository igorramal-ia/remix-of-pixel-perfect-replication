# Requisitos: IA Consultiva

## Visão Geral
Transformar a página "IA Estratégia" em um assistente consultivo interno que permite aos usuários fazer perguntas sobre os dados do sistema e receber respostas baseadas em análises reais do banco de dados.

## Contexto
Atualmente a página "IA Estratégia" não tem funcionalidade real. O objetivo é criar um chat interno onde usuários possam consultar informações do sistema de forma natural, como:
- "Quantos relatórios foram gerados?"
- "Qual campanha tem mais instalações?"
- "Quantos endereços foram veiculados no último mês?"

## Objetivos
1. Criar interface de chat para consultas
2. Interpretar perguntas em linguagem natural
3. Executar queries no banco de dados
4. Apresentar respostas de forma clara e contextualizada
5. Manter histórico de conversas

## Requisitos Funcionais

### RF1: Interface de Chat
**Como** usuário do sistema  
**Quero** uma interface de chat limpa e intuitiva  
**Para que** eu possa fazer perguntas sobre os dados do sistema

**Critérios de Aceitação:**
- [ ] Interface com campo de input para perguntas
- [ ] Histórico de mensagens (perguntas e respostas)
- [ ] Indicador visual quando IA está "pensando"
- [ ] Scroll automático para última mensagem
- [ ] Botão para limpar histórico
- [ ] Design consistente com o resto do sistema

### RF2: Interpretação de Perguntas
**Como** sistema  
**Quero** interpretar perguntas em linguagem natural  
**Para que** eu possa identificar qual informação o usuário busca

**Critérios de Aceitação:**
- [ ] Reconhecer perguntas sobre relatórios (quantidade, período, status)
- [ ] Reconhecer perguntas sobre campanhas (ativas, finalizadas, por estado)
- [ ] Reconhecer perguntas sobre endereços (total, disponíveis, ocupados, por cidade/estado)
- [ ] Reconhecer perguntas sobre instalações (ativas, pendentes, finalizadas)
- [ ] Reconhecer filtros temporais (último mês, última semana, hoje, este ano)
- [ ] Reconhecer filtros geográficos (por estado, por cidade)

### RF3: Consultas ao Banco de Dados
**Como** sistema  
**Quero** executar queries SQL baseadas nas perguntas  
**Para que** eu possa retornar dados reais e atualizados

**Critérios de Aceitação:**
- [ ] Query para contar relatórios (total, por período, por campanha)
- [ ] Query para contar campanhas (ativas, finalizadas, por estado)
- [ ] Query para contar endereços (total, disponíveis, ocupados, por localização)
- [ ] Query para contar instalações (por status, por período)
- [ ] Query para ranking de campanhas (mais instalações, mais endereços)
- [ ] Query para estatísticas gerais do sistema
- [ ] Todas as queries respeitam RLS (Row Level Security)

### RF4: Formatação de Respostas
**Como** usuário  
**Quero** receber respostas claras e bem formatadas  
**Para que** eu possa entender facilmente as informações

**Critérios de Aceitação:**
- [ ] Respostas em linguagem natural (não apenas números)
- [ ] Números formatados (1.234 em vez de 1234)
- [ ] Datas formatadas (01/03/2026 em vez de 2026-03-01)
- [ ] Contexto adicional quando relevante
- [ ] Sugestões de perguntas relacionadas
- [ ] Mensagem amigável quando não entender a pergunta

### RF5: Perguntas Sugeridas
**Como** usuário  
**Quero** ver exemplos de perguntas que posso fazer  
**Para que** eu saiba como usar o sistema

**Critérios de Aceitação:**
- [ ] Lista de perguntas sugeridas ao abrir o chat
- [ ] Perguntas organizadas por categoria (Relatórios, Campanhas, Endereços, Instalações)
- [ ] Clicar em sugestão preenche o campo de input
- [ ] Sugestões contextuais baseadas na última pergunta

### RF6: Tratamento de Erros
**Como** sistema  
**Quero** tratar erros de forma elegante  
**Para que** o usuário não veja mensagens técnicas

**Critérios de Aceitação:**
- [ ] Mensagem amigável quando não entender a pergunta
- [ ] Mensagem amigável quando query falhar
- [ ] Sugestões de reformulação da pergunta
- [ ] Log de erros para debug (não visível ao usuário)

## Requisitos Não-Funcionais

### RNF1: Performance
- Respostas em menos de 2 segundos
- Queries otimizadas com índices apropriados
- Cache de queries frequentes (opcional para MVP)

### RNF2: Segurança
- Respeitar RLS do Supabase
- Não expor estrutura do banco de dados
- Não permitir queries arbitrárias do usuário
- Validar e sanitizar todas as entradas

### RNF3: Usabilidade
- Interface responsiva (mobile e desktop)
- Acessível via teclado (Enter para enviar)
- Feedback visual imediato ao enviar pergunta
- Histórico persistente durante a sessão

### RNF4: Manutenibilidade
- Código modular e testável
- Fácil adicionar novas perguntas/queries
- Documentação clara de como adicionar novos tipos de consulta

## Escopo MVP (Versão Inicial)

### Incluído no MVP:
1. Interface de chat básica
2. Sistema de regras para interpretar perguntas (não IA real)
3. 10-15 tipos de perguntas pré-definidas
4. Queries para dados principais (relatórios, campanhas, endereços, instalações)
5. Formatação básica de respostas
6. Perguntas sugeridas

### Não Incluído no MVP (Futuro):
- IA real com NLP (Natural Language Processing)
- Histórico persistente entre sessões
- Gráficos e visualizações nas respostas
- Exportar respostas
- Múltiplos idiomas
- Aprendizado com feedback do usuário

## Propriedades de Corretude

### P1: Precisão dos Dados
**Propriedade:** Todas as respostas devem refletir dados reais e atualizados do banco de dados  
**Teste:** Comparar resposta da IA com query manual no banco

### P2: Consistência de Interpretação
**Propriedade:** Perguntas similares devem gerar respostas similares  
**Teste:** Fazer variações da mesma pergunta e verificar consistência

### P3: Segurança de Acesso
**Propriedade:** Usuários só devem ver dados que têm permissão para acessar  
**Teste:** Testar com diferentes roles (admin, coordenador, operações)

### P4: Tempo de Resposta
**Propriedade:** 95% das respostas devem ser retornadas em menos de 2 segundos  
**Teste:** Medir tempo de resposta de 100 perguntas aleatórias

## Dependências
- Supabase (banco de dados)
- React Query (cache e queries)
- Lucide Icons (ícones da interface)
- date-fns (formatação de datas)

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Usuários fazem perguntas não suportadas | Médio | Alto | Mensagens claras + sugestões de perguntas |
| Queries lentas | Alto | Médio | Otimizar queries + índices no banco |
| Ambiguidade na interpretação | Médio | Médio | Sistema de regras bem definido + feedback |
| Escalabilidade do sistema de regras | Baixo | Baixo | Arquitetura modular para fácil expansão |

## Métricas de Sucesso
- 80% das perguntas são entendidas corretamente
- Tempo médio de resposta < 1 segundo
- Usuários fazem pelo menos 3 perguntas por sessão
- Taxa de satisfação > 70% (feedback futuro)
