# Plano de Implementação: Sistema de Geração de Relatórios

## Visão Geral

Implementação completa do sistema de geração de relatórios profissionais em formato PowerPoint (PPT), organizados hierarquicamente por Estado → Cidade → Comunidade → Endereço, com suporte a dois tipos de relatório (Parcial e Final) e histórico de relatórios gerados.

## Tecnologias

- **PptxGenJS**: Geração de apresentações PowerPoint
- **Supabase Storage**: Armazenamento de arquivos
- **React Query**: Gerenciamento de estado assíncrono
- **TypeScript**: Tipagem estática
- **fast-check**: Property-based testing

## Tarefas

- [ ] 1. Configurar infraestrutura e dependências
  - [ ] 1.1 Criar migration da tabela relatorios_gerados
    - Criar arquivo `supabase/migrations/20260226030000_create_relatorios_gerados.sql`
    - Definir estrutura da tabela com campos: id, campanha_id, tipo, numero_pi, formato, url_arquivo, nome_arquivo, tamanho_bytes, gerado_por, gerado_em
    - Adicionar constraints e checks (tipo IN ('parcial', 'final'), numero_pi não vazio)
    - Criar índices para performance (campanha_id, tipo, gerado_em, gerado_por)
    - Configurar RLS policies (admins/operações veem todos, coordenadores veem suas campanhas)
    - _Requisitos: 2, 13_
  
  - [ ] 1.2 Configurar bucket Storage para relatórios
    - Criar migration para configurar bucket 'relatorios'
    - Definir políticas de acesso (autenticados podem upload/read, admins/operações podem delete)
    - Configurar estrutura de pastas: `{campanha_id}/{nome_arquivo}.pptx`
    - _Requisitos: 13_
  
  - [ ] 1.3 Instalar dependências do projeto
    - Instalar pptxgenjs: `npm install pptxgenjs`
    - Instalar fast-check para testes: `npm install --save-dev fast-check @types/fast-check`
    - Verificar dependências existentes (date-fns, react-query)
    - _Requisitos: 10_
  
  - [ ] 1.4 Criar tipos TypeScript para relatórios
    - Criar arquivo `src/types/relatorios.ts`
    - Definir tipos: TipoRelatorio, StatusInstalacao, RelatorioGerado, GerarRelatorioParams, DadosRelatorio
    - Definir tipos de agrupamento: EnderecoAgrupado, ComunidadeAgrupada, CidadeAgrupada, EstadoAgrupado, DadosAgrupados
    - _Requisitos: 1, 2, 3_

- [ ] 2. Implementar serviços core
  - [ ] 2.1 Implementar serviço de agrupamento hierárquico
    - Criar arquivo `src/services/agrupamentoService.ts`
    - Implementar função `agruparHierarquicamente(instalacoes)` que agrupa por UF → Cidade → Comunidade
    - Implementar ordenação alfabética em todos os níveis
    - Implementar função `obterNomeEstado(uf)` com mapeamento completo de UFs
    - Calcular totais em cada nível (totalPontos, totalCidades, totalComunidades)
    - _Requisitos: 3.1, 3.2, 7.2_
  
  - [ ]* 2.2 Escrever testes unitários para agrupamento
    - Testar agrupamento por estado
    - Testar ordenação alfabética (estados, cidades, comunidades, endereços)
    - Testar cálculo de totais
    - Testar preservação de dados das instalações
    - _Requisitos: 3.1, 3.2_
  
  - [ ]* 2.3 Escrever teste de propriedade para agrupamento
    - **Property 4: Agrupamento Hierárquico Correto**
    - **Valida: Requisitos 3.1, 3.2**
    - Verificar que total de pontos é preservado
    - Verificar que soma por estado = total
    - Verificar que cada instalação está em exatamente um lugar
    - _Requisitos: 3.1, 3.2_
  
  - [ ] 2.4 Implementar serviço de storage
    - Criar arquivo `src/services/storageService.ts`
    - Implementar função `uploadParaStorage(blob, nomeArquivo, campanhaId)` com tratamento de erros
    - Implementar função `extrairPathDoStorage(url)` para obter path do arquivo
    - Implementar função `downloadBlob(blob, nomeArquivo)` para download automático
    - Implementar função `gerarNomeArquivo(campanha, tipo, numeroPI)` com formato: `{tipo}_PI{numero}_{timestamp}.pptx`
    - _Requisitos: 5.3, 8_
  
  - [ ]* 2.5 Escrever testes unitários para storage
    - Testar geração de nome de arquivo (parcial e final)
    - Testar extração de path do storage
    - Testar formato de timestamp no nome
    - _Requisitos: 8_
  
  - [ ] 2.6 Implementar funções de validação
    - Criar arquivo `src/utils/validacoes.ts`
    - Implementar `validarNumeroPI(numeroPI)` - rejeitar vazio ou apenas espaços
    - Implementar `validarCampanha(campanhaId)` - verificar se existe
    - Implementar `validarInstalacoes(campanhaId, tipo)` - verificar se há instalações do tipo
    - Implementar `validarLimites(campanhaId, tipo)` - máximo 500 endereços
    - _Requisitos: 2, 4.1, 7.5_
  
  - [ ]* 2.7 Escrever testes para validações
    - **Property 1: Validação de Número PI**
    - **Valida: Requisitos 2, 4.1**
    - Testar rejeição de PI vazio
    - Testar rejeição de PI apenas com espaços
    - Testar aceitação de PI válido
    - _Requisitos: 2, 4.1, 7.5_

- [ ] 3. Checkpoint - Validar serviços core
  - Garantir que todos os testes passam
  - Verificar que agrupamento preserva dados corretamente
  - Perguntar ao usuário se há dúvidas

- [ ] 4. Implementar geração de slides do PowerPoint
  - [ ] 4.1 Criar estrutura base do serviço de relatório
    - Criar arquivo `src/services/relatorioService.ts`
    - Implementar função principal `gerarPPT(dados)` que retorna Blob
    - Configurar PptxGenJS (layout 16x9, metadados)
    - Implementar função auxiliar `adicionarGridFotos(slide, urls, x, y, w, h)` para layout de fotos
    - Implementar função `adicionarImagemComFallback(slide, url, x, y, w, h)` com placeholder em caso de erro
    - _Requisitos: 6, 10_
  
  - [ ] 4.2 Implementar slide de capa
    - Implementar função `adicionarSlideCapa(pptx, dados)`
    - Adicionar título "Relatório de Campanha"
    - Adicionar tipo de relatório (Parcial/Final)
    - Adicionar nome da campanha, cliente, número PI
    - Adicionar período (data início - data fim)
    - Adicionar data de geração
    - _Requisitos: 6.1_
  
  - [ ] 4.3 Implementar slide de resumo executivo
    - Implementar função `adicionarSlideResumo(pptx, dados)`
    - Adicionar grid de estatísticas (2x2): Total de Pontos, Estados, Cidades, Comunidades
    - Adicionar tabela de distribuição por estado
    - _Requisitos: 6.2_
  
  - [ ] 4.4 Implementar slides de hierarquia
    - Implementar função `adicionarSlideEstado(pptx, estado)` - cabeçalho do estado
    - Implementar função `adicionarSlideCidade(pptx, cidade, uf)` - cabeçalho da cidade com breadcrumb
    - Implementar função `adicionarSlideComunidade(pptx, comunidade, cidade)` - cabeçalho da comunidade com breadcrumb
    - _Requisitos: 6.3_
  
  - [ ] 4.5 Implementar slide de endereço (CRÍTICO: 1 endereço = 1 slide)
    - Implementar função `adicionarSlideEndereco(pptx, endereco, tipo)` assíncrona
    - **TOPO DO SLIDE**: Endereço completo da placa em destaque (fonte 24, bold)
    - Adicionar linha: Comunidade • Cidade - UF (fonte 14)
    - Adicionar status (Ativa/Finalizada) com cor
    - Adicionar data de instalação (obrigatório, formato dd/MM/yyyy)
    - Adicionar data de retirada (se finalizada e tipo=final, formato dd/MM/yyyy)
    - Adicionar seção "Fotos da Instalação" com grid de até 4 fotos
    - Adicionar seção "Fotos da Retirada" (apenas se tipo=final e instalação finalizada) com grid de até 4 fotos
    - _Requisitos: 4.2, 6.3, 7.3, 7.4_
  
  - [ ]* 4.6 Escrever testes para slides de endereço
    - **Property 5: Um Endereço Por Slide**
    - **Valida: Requisitos 4.2, 7.4**
    - **Property 6: Endereço no Topo do Slide**
    - **Valida: Requisitos 4.2**
    - **Property 7: Fotos da Placa Presentes**
    - **Valida: Requisitos 7.3**
    - **Property 9: Data de Instalação Sempre Presente**
    - **Valida: Requisitos 4.2**
    - _Requisitos: 4.2, 7.3, 7.4_
  
  - [ ] 4.7 Implementar slide de encerramento
    - Implementar função `adicionarSlideEncerramento(pptx)`
    - Adicionar "Obrigado!" em destaque
    - Adicionar contato da empresa
    - _Requisitos: 6.3_
  
  - [ ] 4.8 Integrar todas as funções de slides na geração completa
    - Completar função `gerarPPT(dados)` chamando todas as funções de slides
    - Implementar loop por estados → cidades → comunidades → endereços
    - Garantir ordem correta dos slides
    - Retornar Blob do arquivo PPT gerado
    - _Requisitos: 5.3, 6_

- [ ] 5. Checkpoint - Validar geração de PPT
  - Testar geração com dados de exemplo
  - Verificar que arquivo PPT é válido e pode ser aberto
  - Verificar que 1 endereço = 1 slide
  - Perguntar ao usuário se há dúvidas

- [ ] 6. Implementar filtros e lógica de tipos de relatório
  - [ ] 6.1 Implementar filtro de instalações por tipo
    - Criar função `filtrarInstalacoesPorTipo(instalacoes, tipo)` em `relatorioService.ts`
    - Tipo Parcial: incluir apenas status='ativa'
    - Tipo Final: incluir status='ativa' OU status='finalizada'
    - _Requisitos: 2.1, 2.2, 7.1_
  
  - [ ]* 6.2 Escrever testes de propriedade para filtros
    - **Property 2: Filtro de Instalações por Tipo - Parcial**
    - **Valida: Requisitos 2.1, 7.1**
    - **Property 3: Filtro de Instalações por Tipo - Final**
    - **Valida: Requisitos 2.2, 7.1**
    - _Requisitos: 2.1, 2.2, 7.1_
  
  - [ ] 6.3 Implementar lógica de fotos por tipo
    - Garantir que relatório parcial NÃO mostra fotos de retirada
    - Garantir que relatório final mostra fotos de retirada para instalações finalizadas
    - Implementar verificação de tipo antes de adicionar seção de fotos de retirada
    - _Requisitos: 2.1, 2.2, 7.3_
  
  - [ ]* 6.4 Escrever testes de propriedade para fotos por tipo
    - **Property 8: Fotos de Retirada Apenas em Relatório Final**
    - **Valida: Requisitos 2.1, 2.2, 7.3**
    - Testar que parcial não tem fotos de retirada
    - Testar que final tem fotos de retirada quando finalizada
    - _Requisitos: 2.1, 2.2, 7.3_
  
  - [ ]* 6.5 Escrever teste de propriedade para data de retirada
    - **Property 10: Data de Retirada Quando Finalizada**
    - **Valida: Requisitos 4.2**
    - Verificar que instalação finalizada em relatório final tem data de retirada
    - _Requisitos: 4.2_

- [ ] 7. Implementar hook de geração de relatório
  - [ ] 7.1 Criar hook useGerarRelatorio
    - Criar arquivo `src/hooks/useGerarRelatorio.ts`
    - Usar useMutation do React Query
    - Implementar fluxo completo: validar → buscar dados → agrupar → gerar PPT → upload → salvar registro → download
    - Implementar tratamento de erros específico por tipo de erro
    - Implementar rollback em caso de erro (deletar arquivo do storage e registro do banco)
    - Invalidar cache de relatórios após sucesso
    - Mostrar toast de sucesso/erro
    - _Requisitos: 5, 11_
  
  - [ ] 7.2 Implementar busca de dados da campanha
    - Criar função `buscarDadosCampanha(campanhaId)` no hook
    - Buscar dados completos da campanha (nome, cliente, datas, etc)
    - _Requisitos: 4.1, 5.3_
  
  - [ ] 7.3 Implementar busca de instalações
    - Criar função `buscarInstalacoes(campanhaId, tipo)` no hook
    - Buscar instalações com join de endereços
    - Incluir campos: id, status, data_instalacao, data_retirada_real, fotos_placa, fotos_retirada
    - Incluir campos do endereço: endereco, comunidade, cidade, uf
    - Filtrar por tipo de relatório
    - _Requisitos: 4.2, 5.3_
  
  - [ ] 7.4 Implementar salvamento de registro no histórico
    - Criar função `salvarHistorico(dados)` no hook
    - Inserir registro na tabela relatorios_gerados
    - Incluir todos os campos obrigatórios
    - Retornar registro criado
    - _Requisitos: 8, 11_
  
  - [ ]* 7.5 Escrever teste de propriedade para registro no histórico
    - **Property 11: Registro no Histórico**
    - **Valida: Requisitos 8, 11**
    - Verificar que relatório gerado tem registro correspondente
    - Verificar que todos os campos obrigatórios estão preenchidos
    - _Requisitos: 8, 11_

- [ ] 8. Checkpoint - Validar hook de geração
  - Testar geração completa end-to-end
  - Verificar que arquivo é salvo no storage
  - Verificar que registro é criado no banco
  - Verificar que download automático funciona
  - Perguntar ao usuário se há dúvidas

- [ ] 9. Implementar componente modal de geração
  - [ ] 9.1 Criar componente GerarRelatorioModal
    - Criar arquivo `src/components/GerarRelatorioModal.tsx`
    - Usar Dialog do shadcn/ui
    - Props: open, onOpenChange, campanhaId, campanhaNome
    - Estado local: tipo (parcial/final), numeroPI
    - _Requisitos: 5.2_
  
  - [ ] 9.2 Implementar formulário do modal
    - Adicionar RadioGroup para seleção de tipo (Parcial/Final)
    - Adicionar Input para número PI
    - Adicionar descrição de cada tipo de relatório
    - Adicionar botões Cancelar e Gerar Relatório
    - _Requisitos: 5.2_
  
  - [ ] 9.3 Implementar validação e submit
    - Validar que número PI não está vazio ao clicar em Gerar
    - Mostrar toast de erro se PI vazio
    - Chamar hook useGerarRelatorio ao submeter
    - Mostrar loading durante geração
    - Fechar modal após sucesso
    - _Requisitos: 5.2, 7.5_
  
  - [ ] 9.4 Adicionar indicador de progresso
    - Mostrar spinner ou barra de progresso durante geração
    - Desabilitar botões durante processamento
    - Mostrar mensagem "Gerando relatório..."
    - _Requisitos: 5.3, 10.2_

- [ ] 10. Integrar modal com página de detalhes da campanha
  - [ ] 10.1 Adicionar botão "Gerar Relatório" em CampaignDetail
    - Abrir arquivo `src/pages/CampaignDetail.tsx` (ou similar)
    - Adicionar botão "Gerar Relatório" na seção de ações
    - Adicionar estado para controlar abertura do modal
    - _Requisitos: 5.1_
  
  - [ ] 10.2 Integrar GerarRelatorioModal em CampaignDetail
    - Importar e renderizar GerarRelatorioModal
    - Passar props: open, onOpenChange, campanhaId, campanhaNome
    - Testar fluxo completo: clicar botão → abrir modal → gerar relatório
    - _Requisitos: 5.1, 5.2_

- [ ] 11. Implementar hooks de histórico de relatórios
  - [ ] 11.1 Criar hook useRelatorios
    - Criar arquivo `src/hooks/useRelatorios.ts`
    - Usar useQuery do React Query
    - Aceitar filtros: campanhaId, tipo, dataInicio, dataFim
    - Buscar relatórios com join de campanha e perfil do gerador
    - Ordenar por gerado_em DESC
    - Aplicar filtros dinamicamente
    - _Requisitos: 8.3, 15_
  
  - [ ]* 11.2 Escrever teste de propriedade para filtros de histórico
    - **Property 12: Filtros de Histórico**
    - **Valida: Requisitos 8.3, 15**
    - Verificar que resultados correspondem aos filtros aplicados
    - _Requisitos: 8.3, 15_
  
  - [ ] 11.3 Criar hook useDeletarRelatorio
    - Criar arquivo `src/hooks/useDeletarRelatorio.ts`
    - Usar useMutation do React Query
    - Buscar dados do relatório (url_arquivo, campanha_id)
    - Extrair path do arquivo
    - Deletar arquivo do storage
    - Deletar registro do banco
    - Invalidar cache de relatórios
    - Mostrar toast de sucesso/erro
    - _Requisitos: 8.3, 9.3_

- [ ] 12. Implementar página de histórico de relatórios
  - [ ] 12.1 Criar componente RelatoriosPage
    - Criar arquivo `src/components/RelatoriosPage.tsx` (ou `src/pages/RelatoriosPage.tsx`)
    - Usar hook useRelatorios
    - Estado local para filtros
    - _Requisitos: 8.3_
  
  - [ ] 12.2 Implementar filtros da página
    - Adicionar Select para filtro por campanha
    - Adicionar Select para filtro por tipo (Parcial/Final/Todos)
    - Adicionar DatePicker para filtro por data início
    - Adicionar DatePicker para filtro por data fim
    - Adicionar botão "Limpar Filtros"
    - _Requisitos: 8.3_
  
  - [ ] 12.3 Implementar tabela de relatórios
    - Criar Table com colunas: Campanha, Tipo, Número PI, Gerado por, Data, Tamanho, Ações
    - Formatar data com date-fns (dd/MM/yyyy HH:mm)
    - Formatar tamanho em MB
    - Mostrar badge para tipo (Parcial/Final)
    - Mostrar loading enquanto carrega
    - Mostrar mensagem se não há relatórios
    - _Requisitos: 8.2, 8.3_
  
  - [ ] 12.4 Implementar ações da tabela
    - Adicionar botão "Download" que abre URL do arquivo em nova aba
    - Adicionar botão "Deletar" (apenas para admins/operações)
    - Adicionar confirmação antes de deletar
    - Usar hook useDeletarRelatorio
    - _Requisitos: 8.3, 9.3_
  
  - [ ] 12.5 Adicionar rota para página de relatórios
    - Adicionar rota `/relatorios` no router da aplicação
    - Adicionar link no menu de navegação
    - Configurar permissões de acesso (admins, operações, coordenadores)
    - _Requisitos: 8.3, 9_

- [ ] 13. Checkpoint - Validar UI completa
  - Testar fluxo completo de geração via modal
  - Testar página de histórico com filtros
  - Testar download de relatórios
  - Testar deleção de relatórios
  - Perguntar ao usuário se há dúvidas

- [ ] 14. Implementar otimizações de performance
  - [ ] 14.1 Implementar carregamento de imagens em lote
    - Criar função `carregarImagensEmLote(urls)` em `relatorioService.ts`
    - Limitar concorrência (BATCH_SIZE = 5)
    - Processar imagens em batches
    - Tratar erros individuais sem interromper batch
    - _Requisitos: 10.2_
  
  - [ ] 14.2 Implementar compressão de imagens
    - Criar função `comprimirImagem(blob, maxWidth)` em `relatorioService.ts`
    - Redimensionar imagens mantendo aspect ratio (max 1920px)
    - Comprimir com qualidade 85%
    - Usar canvas para processamento
    - _Requisitos: 10.2_
  
  - [ ] 14.3 Adicionar indicador de progresso detalhado
    - Implementar estado de progresso no hook useGerarRelatorio
    - Atualizar progresso em cada etapa (buscar dados 20%, agrupar 10%, gerar PPT 50%, upload 10%, salvar 10%)
    - Mostrar barra de progresso no modal
    - _Requisitos: 10.2_
  
  - [ ] 14.4 Implementar cache otimizado de dados
    - Configurar staleTime e cacheTime no useQuery
    - Otimizar query de dados da campanha (buscar tudo em uma query com joins)
    - _Requisitos: 10.2_

- [ ] 15. Implementar tratamento de erros robusto
  - [ ] 15.1 Adicionar tratamento de erros na geração
    - Implementar try-catch em todas as etapas
    - Log detalhado de erros com contexto
    - Mensagens de erro específicas por tipo
    - _Requisitos: 10.2_
  
  - [ ] 15.2 Implementar rollback completo
    - Implementar função `gerarRelatorioComRollback` no hook
    - Deletar arquivo do storage se erro após upload
    - Deletar registro do banco se erro após inserção
    - Log de erros de rollback
    - _Requisitos: 10.2_
  
  - [ ] 15.3 Adicionar validação de limites
    - Validar número máximo de endereços (500)
    - Validar tamanho máximo do arquivo (50MB)
    - Mostrar mensagens claras ao usuário
    - _Requisitos: 10.2_

- [ ] 16. Testes de integração e validação final
  - [ ]* 16.1 Escrever testes de integração
    - Testar geração completa de relatório parcial
    - Testar geração completa de relatório final
    - Verificar que arquivo é válido
    - Verificar que registro é criado
    - _Requisitos: 12_
  
  - [ ]* 16.2 Escrever testes de performance
    - Testar geração com 100 endereços em menos de 30 segundos
    - Testar que arquivo gerado tem menos de 50MB
    - _Requisitos: 10.2_
  
  - [ ] 16.3 Validar todos os critérios de aceitação
    - Verificar que modal solicita tipo e número PI
    - Verificar que número PI é obrigatório
    - Verificar que relatório parcial inclui apenas ativas
    - Verificar que relatório final inclui ativas e finalizadas
    - Verificar organização hierárquica (Estado → Cidade → Comunidade)
    - Verificar que 1 endereço = 1 slide
    - Verificar que endereço aparece em destaque no topo
    - Verificar que fotos da placa aparecem
    - Verificar que fotos de retirada aparecem apenas no final
    - Verificar que datas estão presentes e formatadas
    - Verificar que arquivo PPT é gerado e baixado
    - Verificar que registro é salvo no histórico
    - Verificar que página de relatórios funciona
    - Verificar que filtros funcionam
    - Verificar que download do histórico funciona
    - Verificar layout profissional e editável
    - _Requisitos: 12_

- [ ] 17. Checkpoint final - Garantir qualidade
  - Executar todos os testes (unitários, propriedades, integração)
  - Testar manualmente todos os fluxos
  - Verificar performance com dados reais
  - Verificar compatibilidade do PPT (PowerPoint, Google Slides, LibreOffice)
  - Perguntar ao usuário se está tudo funcionando conforme esperado

## Notas Importantes

- **Tarefas marcadas com `*` são opcionais** e podem ser puladas para MVP mais rápido
- **Property-based tests** usam fast-check com mínimo 100 iterações
- **1 endereço = 1 slide** é uma regra CRÍTICA do sistema
- **Endereço deve aparecer em destaque no topo** de cada slide
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedades validam correção universal
- Testes unitários validam exemplos específicos e edge cases

## Ordem de Implementação Recomendada

1. **Infraestrutura** (Tarefas 1.x): Base de dados e configurações
2. **Serviços Core** (Tarefas 2.x): Lógica de negócio fundamental
3. **Geração de PPT** (Tarefas 4.x): Motor de geração de slides
4. **Filtros e Tipos** (Tarefas 6.x): Lógica de tipos de relatório
5. **Hook de Geração** (Tarefas 7.x): Integração com React Query
6. **UI - Modal** (Tarefas 9.x, 10.x): Interface de geração
7. **UI - Histórico** (Tarefas 11.x, 12.x): Interface de consulta
8. **Otimizações** (Tarefas 14.x, 15.x): Performance e robustez
9. **Validação Final** (Tarefas 16.x, 17.x): Testes e qualidade
