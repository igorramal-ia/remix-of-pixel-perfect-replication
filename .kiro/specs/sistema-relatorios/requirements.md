# Requisitos: Sistema de Geração de Relatórios

## 1. Visão Geral

Sistema para gerar relatórios profissionais de campanhas em formato PowerPoint (PPT), organizados hierarquicamente por Estado → Cidade → Comunidade, com fotos das instalações e dados completos.

## 2. Tipos de Relatório

### 2.1 Relatório Parcial (Tipo 1)
- **Objetivo**: Acompanhamento durante a campanha
- **Conteúdo**:
  - Apenas instalações ATIVAS
  - Fotos da placa instalada
  - Data de instalação
  - Status atual

### 2.2 Relatório Final (Tipo 2)
- **Objetivo**: Fechamento da campanha
- **Conteúdo**:
  - Instalações ATIVAS e FINALIZADAS
  - Fotos da placa instalada
  - Fotos da retirada (se finalizada)
  - Data de instalação
  - Data de retirada (se finalizada)
  - Status final

## 3. Estrutura Hierárquica

### Organização dos Dados
```
Relatório
├── Estado (UF)
│   ├── Cidade
│   │   ├── Comunidade
│   │   │   ├── Endereço 1
│   │   │   │   ├── Fotos instalação
│   │   │   │   └── Fotos retirada (se final)
│   │   │   ├── Endereço 2
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

### Agrupamento
- **Nível 1**: Estado (SP, RJ, MG, etc.)
- **Nível 2**: Cidade dentro do estado
- **Nível 3**: Comunidade dentro da cidade
- **Nível 4**: Endereços individuais

## 4. Dados Obrigatórios

### 4.1 Informações da Campanha
- Nome da campanha
- Cliente
- **Número PI** (Pedido de Inserção) - Solicitado ao gerar
- Período (data início - data fim)
- Total de pontos
- Pontos instalados
- Progresso (%)

### 4.2 Informações por Endereço
⚠️ **1 ENDEREÇO = 1 SLIDE**

- **Endereço completo da placa** (destaque no topo do slide)
- Comunidade
- Cidade
- Estado (UF)
- Status (Ativa/Finalizada)
- **Data de instalação** (obrigatório)
- **Data de retirada** (se finalizada)
- Fotos da placa (2-5 fotos)
- Fotos da retirada (2+ fotos, apenas relatório final)

## 5. Fluxo de Geração

### 5.1 Iniciação
1. Usuário acessa página da campanha
2. Clica em "Gerar Relatório"
3. Sistema abre modal

### 5.2 Modal de Configuração
```
┌─────────────────────────────────────┐
│ Gerar Relatório                     │
├─────────────────────────────────────┤
│                                     │
│ Tipo de Relatório:                  │
│ ○ Parcial (apenas instalações)     │
│ ○ Final (instalação + retirada)    │
│                                     │
│ Número PI: [____________]           │
│                                     │
│ [Cancelar] [Gerar Relatório]        │
└─────────────────────────────────────┘
```

### 5.3 Processamento
1. Validar número PI (obrigatório)
2. Buscar dados da campanha
3. Buscar instalações (filtradas por tipo)
4. Agrupar por Estado → Cidade → Comunidade
5. Buscar fotos das placas
6. Buscar fotos de retirada (se tipo Final)
7. Gerar slides do PowerPoint
8. Fazer download automático

### 5.4 Pós-Geração
- Salvar registro em histórico
- Armazenar arquivo no storage
- Permitir download posterior

## 6. Estrutura do PowerPoint

### Slide 1: Capa
- Logo da empresa
- Título: "Relatório de Campanha"
- Nome da campanha
- Cliente
- **Número PI**
- Período
- Data de geração

### Slide 2: Resumo Executivo
- Total de pontos
- Pontos instalados
- Pontos finalizados (se relatório final)
- Progresso (%)
- Gráfico de pizza (status)
- Distribuição por estado

### Slides 3+: Por Estado
Para cada estado:

#### Slide: Cabeçalho do Estado
- Nome do estado (ex: "São Paulo - SP")
- Total de pontos no estado
- Total de cidades
- Total de comunidades

#### Slides: Por Cidade
Para cada cidade no estado:

**Slide: Cabeçalho da Cidade**
- Nome da cidade
- Total de pontos na cidade
- Total de comunidades

**Slides: Por Comunidade**
Para cada comunidade na cidade:

**Slide: Cabeçalho da Comunidade**
- Nome da comunidade
- Total de pontos na comunidade

**Slides: Endereços**
⚠️ **IMPORTANTE: 1 ENDEREÇO POR SLIDE**

Para cada endereço na comunidade, criar um slide individual:

**Layout do Slide:**
```
┌─────────────────────────────────────┐
│ ENDEREÇO DA PLACA:                  │
│ R. Exemplo, 123 - Brasilândia       │
│ São Paulo - SP                      │
│                                     │
│ Status: Ativa                       │
│ Data Instalação: 26/02/2026         │
│ Data Retirada: 27/03/2026 (se final)│
│                                     │
│ Fotos da Instalação:                │
│ [Foto 1] [Foto 2]                   │
│ [Foto 3] [Foto 4]                   │
│                                     │
│ Fotos da Retirada: (se final)       │
│ [Foto 1] [Foto 2]                   │
└─────────────────────────────────────┘
```

### Último Slide: Encerramento
- Agradecimento
- Contato da empresa
- Logo

## 7. Regras de Negócio

### 7.1 Filtros por Tipo
**Relatório Parcial:**
- Incluir apenas instalações com status "ativa"
- Mostrar apenas fotos da placa

**Relatório Final:**
- Incluir instalações "ativa" e "finalizada"
- Mostrar fotos da placa
- Mostrar fotos de retirada (se finalizada)

### 7.2 Ordenação
- Estados: Ordem alfabética
- Cidades: Ordem alfabética dentro do estado
- Comunidades: Ordem alfabética dentro da cidade
- Endereços: Ordem alfabética dentro da comunidade

### 7.3 Fotos
- **Fotos da Placa**: Apenas `fotos_placa` (não incluir `foto_recibo`)
- **Fotos da Retirada**: Apenas `fotos_retirada`
- Máximo 4 fotos por tipo por slide
- Se mais de 4 fotos, criar slide adicional para o mesmo endereço

### 7.4 Slides por Endereço
⚠️ **REGRA CRÍTICA**: 
- **1 endereço = 1 slide** (mínimo)
- Se endereço tiver mais de 4 fotos de instalação, criar slide adicional
- Se endereço tiver mais de 4 fotos de retirada, criar slide adicional
- Cada slide deve mostrar claramente o endereço da placa no topo

### 7.5 Validações
- Número PI é obrigatório
- Campanha deve ter pelo menos 1 instalação
- Instalações devem ter fotos da placa
- Relatório Final: instalações finalizadas devem ter fotos de retirada

## 8. Histórico de Relatórios

### 8.1 Armazenamento
- Salvar em `relatorios_gerados`
- Armazenar arquivo no Supabase Storage
- Bucket: `relatorios`

### 8.2 Dados do Histórico
- ID do relatório
- Campanha vinculada
- Tipo (Parcial/Final)
- Número PI usado
- Formato (PPT)
- URL do arquivo
- Gerado por (usuário)
- Data/hora de geração
- Tamanho do arquivo
- Nome do arquivo

### 8.3 Página de Relatórios
- Listar todos os relatórios gerados
- Filtrar por:
  - Campanha
  - Tipo (Parcial/Final)
  - Data de geração
  - Usuário que gerou
- Ações:
  - Download
  - Deletar (apenas admins/operações)
  - Visualizar detalhes

## 9. Permissões

### 9.1 Gerar Relatório
- **Administrador**: Todas as campanhas
- **Operações**: Todas as campanhas
- **Coordenador**: Apenas suas campanhas (futuro)

### 9.2 Visualizar Histórico
- **Administrador**: Todos os relatórios
- **Operações**: Todos os relatórios
- **Coordenador**: Apenas relatórios das suas campanhas (futuro)

### 9.3 Deletar Relatório
- **Administrador**: Sim
- **Operações**: Sim
- **Coordenador**: Não

## 10. Requisitos Técnicos

### 10.1 Biblioteca
- **PptxGenJS** para geração de PowerPoint
- Suporta:
  - Slides customizados
  - Imagens
  - Tabelas
  - Texto formatado
  - Layouts

### 10.2 Performance
- Mostrar loading durante geração
- Processar em background
- Limitar tamanho máximo: 50MB
- Comprimir imagens se necessário

### 10.3 Compatibilidade
- PowerPoint 2016+
- Google Slides
- LibreOffice Impress

## 11. Casos de Uso

### UC1: Gerar Relatório Parcial
**Ator**: Operador
**Pré-condições**: Campanha com instalações ativas
**Fluxo**:
1. Acessa página da campanha
2. Clica em "Gerar Relatório"
3. Seleciona "Parcial"
4. Informa número PI
5. Clica em "Gerar"
6. Sistema processa e faz download
**Pós-condições**: Arquivo PPT baixado, registro salvo

### UC2: Gerar Relatório Final
**Ator**: Operador
**Pré-condições**: Campanha com instalações finalizadas
**Fluxo**:
1. Acessa página da campanha
2. Clica em "Gerar Relatório"
3. Seleciona "Final"
4. Informa número PI
5. Clica em "Gerar"
6. Sistema processa e faz download
**Pós-condições**: Arquivo PPT baixado com fotos de instalação e retirada

### UC3: Acessar Histórico
**Ator**: Operador
**Pré-condições**: Relatórios já gerados
**Fluxo**:
1. Acessa página "Relatórios"
2. Visualiza lista de relatórios
3. Filtra por campanha/tipo/data
4. Clica em "Download" para baixar novamente
**Pós-condições**: Arquivo baixado

## 12. Critérios de Aceitação

- [ ] Modal de geração solicita tipo e número PI
- [ ] Número PI é obrigatório
- [ ] Relatório Parcial inclui apenas instalações ativas
- [ ] Relatório Final inclui ativas e finalizadas
- [ ] Dados organizados por Estado → Cidade → Comunidade
- [ ] **1 endereço = 1 slide** (regra crítica)
- [ ] **Endereço da placa aparece em destaque no topo de cada slide**
- [ ] Fotos da placa aparecem corretamente
- [ ] Fotos de retirada aparecem apenas no relatório final
- [ ] Datas de instalação sempre presentes
- [ ] Datas de retirada presentes quando finalizada
- [ ] Arquivo PPT é gerado e baixado
- [ ] Registro salvo no histórico
- [ ] Página de relatórios lista todos os gerados
- [ ] Filtros funcionam corretamente
- [ ] Download do histórico funciona
- [ ] Layout profissional e editável

## 13. Melhorias Futuras

- [ ] Geração de PDF (não editável)
- [ ] Templates customizáveis
- [ ] Agendamento de relatórios
- [ ] Envio por email
- [ ] Relatórios comparativos (múltiplas campanhas)
- [ ] Exportar dados para Excel
- [ ] Gráficos avançados
- [ ] Mapa integrado no relatório
