# Sistema de Geração de Relatórios - Instruções de Aplicação

## ✅ Implementação Completa

O sistema de geração de relatórios foi implementado com sucesso! Todos os componentes, hooks, serviços e migrations foram criados.

## 📋 Migrations Criadas

Foram criadas 2 migrations SQL que precisam ser aplicadas no Supabase:

### 1. `supabase/migrations/20260226030000_create_relatorios_gerados.sql`
- Cria tabela `relatorios_gerados` para armazenar histórico
- Adiciona índices para performance
- Configura RLS policies (admins/operações veem todos, coordenadores veem suas campanhas)

### 2. `supabase/migrations/20260226030001_setup_storage_relatorios.sql`
- Cria bucket `relatorios` no Supabase Storage
- Configura políticas de acesso (upload, read, delete)

## 🚀 Como Aplicar as Migrations

### Opção 1: SQL Editor do Supabase (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo de `supabase/migrations/20260226030000_create_relatorios_gerados.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Repita os passos 4-6 para `supabase/migrations/20260226030001_setup_storage_relatorios.sql`

### Opção 2: Supabase CLI (Alternativa)

```bash
# Se você usa Supabase CLI
supabase db push
```

## 📦 Dependências Instaladas

As seguintes dependências foram instaladas automaticamente:

- `pptxgenjs` - Geração de arquivos PowerPoint
- `fast-check` - Property-based testing (dev dependency)

## 🎯 Funcionalidades Implementadas

### 1. Geração de Relatórios
- ✅ Modal de configuração (tipo + número PI)
- ✅ Validação de número PI obrigatório
- ✅ 2 tipos de relatório:
  - **Parcial**: Apenas instalações ativas
  - **Final**: Instalações ativas + finalizadas
- ✅ Organização hierárquica: Estado → Cidade → Comunidade → Endereço
- ✅ **1 endereço = 1 slide** (regra crítica)
- ✅ Endereço em destaque no topo de cada slide
- ✅ Fotos da placa (não inclui foto do recibo)
- ✅ Fotos de retirada (apenas relatório final)
- ✅ Datas formatadas (instalação e retirada)
- ✅ Download automático do arquivo PPT

### 2. Histórico de Relatórios
- ✅ Página de listagem de relatórios gerados
- ✅ Filtros por campanha, tipo, data
- ✅ Download de relatórios anteriores
- ✅ Deleção de relatórios (apenas admins/operações)
- ✅ Informações detalhadas (gerado por, tamanho, data)

### 3. Estrutura do PowerPoint
- ✅ Slide 1: Capa (logo, nome, cliente, PI, período)
- ✅ Slide 2: Resumo executivo (estatísticas, distribuição)
- ✅ Slides 3+: Hierarquia (estado → cidade → comunidade → endereços)
- ✅ Último slide: Encerramento

### 4. Permissões
- ✅ Administradores: Acesso total
- ✅ Operações: Acesso total
- ✅ Coordenadores: Podem gerar e ver relatórios das suas campanhas

## 📁 Arquivos Criados

### Migrations
- `supabase/migrations/20260226030000_create_relatorios_gerados.sql`
- `supabase/migrations/20260226030001_setup_storage_relatorios.sql`

### Tipos TypeScript
- `src/types/relatorios.ts`

### Serviços
- `src/services/agrupamentoService.ts` - Agrupamento hierárquico
- `src/services/relatorioService.ts` - Geração de PPT
- `src/services/storageService.ts` - Upload/download

### Utilitários
- `src/utils/validacoes.ts` - Validações de entrada

### Hooks
- `src/hooks/useGerarRelatorio.ts` - Hook principal de geração
- `src/hooks/useRelatorios.ts` - Hooks de histórico e deleção

### Componentes
- `src/components/GerarRelatorioModal.tsx` - Modal de configuração
- `src/pages/RelatoriosPage.tsx` - Página de histórico

### Integrações
- `src/pages/CampaignDetail.tsx` - Botão "Gerar Relatório" adicionado
- `src/App.tsx` - Rota `/relatorios` configurada

## 🧪 Como Testar

### 1. Testar Geração de Relatório

1. Acesse uma campanha que tenha instalações ativas
2. Clique no botão **"Gerar Relatório"**
3. Selecione o tipo (Parcial ou Final)
4. Informe um número PI (ex: PI-12345)
5. Clique em **"Gerar Relatório"**
6. Aguarde o processamento (alguns segundos)
7. O arquivo PPT será baixado automaticamente
8. Abra o arquivo no PowerPoint/Google Slides/LibreOffice

### 2. Verificar Estrutura do PPT

- ✅ Slide de capa com todas as informações
- ✅ Slide de resumo com estatísticas
- ✅ Slides de hierarquia (estado, cidade, comunidade)
- ✅ **1 slide por endereço** com endereço em destaque no topo
- ✅ Fotos da placa presentes
- ✅ Fotos de retirada (apenas relatório final)
- ✅ Datas formatadas corretamente

### 3. Testar Histórico

1. Acesse o menu **"Relatórios"**
2. Verifique que o relatório gerado aparece na lista
3. Teste os filtros (campanha, tipo)
4. Clique em **"Download"** para baixar novamente
5. Se for admin/operações, teste deletar um relatório

## ⚠️ Pontos de Atenção

### Regras Críticas
- **1 endereço = 1 slide**: Cada endereço tem seu próprio slide individual
- **Endereço no topo**: O endereço completo aparece em destaque no topo de cada slide
- **Fotos da placa**: Apenas `fotos_placa` são incluídas (não `foto_recibo`)
- **Número PI obrigatório**: Sistema não permite gerar sem informar o PI

### Limites
- Máximo 500 endereços por relatório
- Máximo 50MB por arquivo
- Timeout de 60 segundos para geração

### Performance
- Imagens são carregadas em lote (5 por vez)
- Sistema mostra loading durante processamento
- Rollback automático em caso de erro

## 🐛 Troubleshooting

### Erro: "Número PI é obrigatório"
- Certifique-se de preencher o campo Número PI antes de gerar

### Erro: "Nenhuma instalação ativa encontrada"
- A campanha precisa ter pelo menos 1 instalação ativa (para parcial) ou ativa/finalizada (para final)

### Erro: "Limite de 500 endereços excedido"
- Considere gerar relatórios separados por estado ou cidade

### Erro ao carregar imagens no PPT
- Verifique se as URLs das fotos estão acessíveis
- Sistema adiciona placeholder em caso de erro

### Relatório não aparece no histórico
- Verifique se as migrations foram aplicadas corretamente
- Verifique as RLS policies no Supabase

## 📊 Próximos Passos (Melhorias Futuras)

- [ ] Adicionar gráficos ao slide de resumo
- [ ] Permitir customização de logo e cores
- [ ] Exportar para PDF (não editável)
- [ ] Templates customizáveis por cliente
- [ ] Agendamento de relatórios automáticos
- [ ] Envio por email após geração

## ✅ Checklist de Validação

Antes de considerar o sistema pronto para produção, verifique:

- [ ] Migrations aplicadas no Supabase
- [ ] Bucket `relatorios` criado no Storage
- [ ] Botão "Gerar Relatório" aparece em CampaignDetail
- [ ] Modal abre e permite selecionar tipo e PI
- [ ] Relatório é gerado e baixado automaticamente
- [ ] Arquivo PPT abre corretamente no PowerPoint
- [ ] 1 endereço = 1 slide (verificar manualmente)
- [ ] Endereço aparece em destaque no topo
- [ ] Fotos da placa aparecem corretamente
- [ ] Fotos de retirada aparecem apenas no relatório final
- [ ] Datas estão formatadas (dd/MM/yyyy)
- [ ] Página de relatórios lista os gerados
- [ ] Filtros funcionam corretamente
- [ ] Download do histórico funciona
- [ ] Deleção funciona (apenas admins/operações)

## 🎉 Conclusão

O sistema de geração de relatórios está completo e pronto para uso! Basta aplicar as migrations no Supabase e começar a gerar relatórios profissionais em PowerPoint.

**Tempo estimado de aplicação**: 5-10 minutos
**Complexidade**: Baixa (apenas copiar e colar SQL)

Se tiver dúvidas ou encontrar problemas, consulte os logs do console do navegador para mais detalhes sobre erros.
