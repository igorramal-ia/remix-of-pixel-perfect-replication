# 📊 Especificação: Sistema de Relatórios

## 🎯 Objetivo

Permitir que operadores gerem relatórios profissionais de campanhas em PDF e PPT, com histórico de relatórios gerados.

## 📋 Requisitos

### 1. Geração de Relatórios

#### Formatos Disponíveis
- **PDF** - Documento final para cliente (não editável)
- **PPT** - Apresentação editável para ajustes

#### Onde Gerar
- **Página de Campanha** - Botão "Gerar Relatório" na página de detalhes
- **Página de Relatórios** - Lista de campanhas com opção de gerar

#### Dados do Relatório
- Nome da campanha
- Cliente
- Período (data início - data fim)
- Total de pontos
- Pontos instalados
- Progresso (%)
- Lista de endereços com:
  - Endereço completo
  - Comunidade
  - Cidade/UF
  - Status
  - Data de instalação
  - Data de retirada
  - **Fotos da placa** (apenas as fotos da placa, não o recibo)
- Mapa com marcadores
- Estatísticas gerais

### 2. Histórico de Relatórios

#### Tabela `relatorios_gerados`
```sql
CREATE TABLE relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas(id),
  formato VARCHAR(10), -- 'pdf' ou 'ppt'
  arquivo_url TEXT,
  gerado_por UUID REFERENCES profiles(id),
  gerado_em TIMESTAMP DEFAULT NOW(),
  tamanho_bytes BIGINT,
  nome_arquivo TEXT
);
```

#### Funcionalidades
- Listar todos os relatórios gerados
- Filtrar por campanha
- Filtrar por formato (PDF/PPT)
- Filtrar por data
- Download direto
- Deletar relatório antigo

### 3. Interface

#### Página de Campanha
```
┌─────────────────────────────────────────┐
│ Campanha XYZ                            │
│ [Adicionar Pontos] [Gerar Relatório ▼] │
│                                         │
│ Dropdown:                               │
│ - Gerar PDF                             │
│ - Gerar PPT                             │
└─────────────────────────────────────────┘
```

#### Página de Relatórios
```
┌─────────────────────────────────────────┐
│ Relatórios                              │
│                                         │
│ Filtros:                                │
│ [Campanha ▼] [Formato ▼] [Data ▼]      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Campanha ABC - PDF                  │ │
│ │ Gerado em: 26/02/2026 14:30         │ │
│ │ Por: João Silva                     │ │
│ │ [Download] [Deletar]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Campanha XYZ - PPT                  │ │
│ │ Gerado em: 25/02/2026 10:15         │ │
│ │ Por: Maria Santos                   │ │
│ │ [Download] [Deletar]                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🛠️ Tecnologias

### Para PDF
- **jsPDF** - Geração de PDF no frontend
- **html2canvas** - Captura de elementos HTML (mapa, gráficos)
- **jsPDF-AutoTable** - Tabelas formatadas

### Para PPT
- **PptxGenJS** - Geração de PowerPoint no frontend
- Suporta:
  - Slides com layout customizado
  - Imagens
  - Tabelas
  - Gráficos
  - Texto formatado

### Storage
- **Supabase Storage** - Armazenar relatórios gerados
- Bucket: `relatorios`
- RLS habilitado
- Limite: 50MB por arquivo

## 📐 Estrutura do Relatório

### Capa
- Logo da empresa
- Nome da campanha
- Cliente
- Período
- Data de geração

### Resumo Executivo
- Total de pontos
- Pontos instalados
- Progresso
- Gráfico de pizza (status)

### Mapa
- Mapa com todos os pontos
- Legenda de cores

### Detalhamento por Endereço
Para cada endereço ATIVO ou FINALIZADO:
- Endereço completo
- Comunidade, Cidade/UF
- Data de instalação
- Data de retirada (se finalizado)
- **Fotos da placa** (grid 2x2 ou 3x1)
- Status

### Estatísticas
- Total por status
- Total por cidade
- Total por comunidade
- Timeline de instalações

## 🔐 Permissões

- **Administrador**: Gerar e ver todos os relatórios
- **Operações**: Gerar e ver todos os relatórios
- **Coordenador**: Ver apenas relatórios das suas campanhas

## 📝 Fluxo de Geração

1. Usuário clica em "Gerar Relatório"
2. Seleciona formato (PDF ou PPT)
3. Sistema mostra loading
4. Sistema busca dados da campanha
5. Sistema busca fotos das placas
6. Sistema gera documento
7. Sistema faz upload para storage
8. Sistema salva registro em `relatorios_gerados`
9. Sistema faz download automático
10. Usuário pode acessar depois na página de Relatórios

## 🎨 Customização

### Configurações Globais
- Logo da empresa
- Cores do tema
- Fonte padrão
- Rodapé (contato, site)

### Por Campanha
- Incluir/excluir mapa
- Incluir/excluir fotos
- Incluir/excluir endereços pendentes
- Ordem de exibição (por data, por cidade, etc.)

## 📊 Métricas

- Total de relatórios gerados
- Formato mais usado (PDF vs PPT)
- Tempo médio de geração
- Tamanho médio dos arquivos

## 🚀 Implementação em Fases

### Fase 1 (MVP)
- Geração de PDF básico
- Dados da campanha
- Lista de endereços
- Sem fotos

### Fase 2
- Adicionar fotos das placas
- Melhorar layout
- Adicionar mapa

### Fase 3
- Geração de PPT
- Histórico de relatórios
- Página de Relatórios

### Fase 4
- Customizações avançadas
- Templates diferentes
- Agendamento de relatórios

## 📦 Bibliotecas Necessárias

```bash
npm install jspdf jspdf-autotable html2canvas pptxgenjs
```

## 🔍 Pontos de Atenção

1. **Fotos**: Apenas fotos da placa (não o recibo)
2. **Performance**: Gerar relatório pode demorar com muitas fotos
3. **Tamanho**: Limitar número de fotos por endereço
4. **Qualidade**: Comprimir imagens para reduzir tamanho
5. **Browser**: Testar em diferentes navegadores

---

**Aguardando modelo de report para ajustar especificação!**
