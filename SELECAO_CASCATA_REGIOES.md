# Seleção em Cascata de Regiões - Criação de Campanhas

## Visão Geral

Sistema de seleção estruturada de regiões (UF → Cidade → Comunidade) para criação de campanhas, com suporte a cidades novas e cobertura de cidade inteira.

## Mudanças Implementadas

### 1. Nova Tabela: `cidades_cobertura`

Tabela de referência para cidades cobertas pelo sistema.

```sql
CREATE TABLE public.cidades_cobertura (
  id UUID PRIMARY KEY,
  uf TEXT NOT NULL,
  cidade TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (uf, cidade)
);
```

**Propósito:**
- Armazenar cidades adicionadas manualmente pelos admins
- Servir como referência para o select de cidades
- Combinar com cidades da tabela `enderecos` para lista completa

**Populamento Inicial:**
- Automaticamente populada com cidades existentes em `enderecos`
- Admins podem adicionar novas cidades via modal

### 2. Hook `useRegioes.ts`

Novo hook para gerenciar queries de regiões:

**Constante:**
- `UFS_BRASIL`: Array com as 27 UFs brasileiras

**Queries:**
- `useCidadesPorUF(uf)`: Busca cidades únicas de uma UF
  - Combina dados de `enderecos` e `cidades_cobertura`
  - Remove duplicatas e ordena alfabeticamente
  
- `useComunidadesPorCidade(uf, cidade)`: Busca comunidades de uma cidade
  - Busca apenas em `enderecos` (comunidades reais)
  - Remove duplicatas e ordena alfabeticamente

- `useEnderecosDisponiveis({ uf, cidade, comunidade })`: Busca endereços disponíveis
  - Filtra por status = "disponivel"
  - Se comunidade específica: filtra por comunidade
  - Se cidade inteira: retorna todos da cidade

**Mutations:**
- `useAdicionarCidade()`: Adiciona nova cidade em `cidades_cobertura`
  - Valida duplicatas via constraint UNIQUE
  - Invalida cache de cidades após inserção

### 3. Atualização do Modal de Criação

#### Interface `Grupo` Atualizada
```typescript
interface Grupo {
  id: string;
  uf: string;              // Novo: UF selecionada
  cidade: string;          // Novo: Cidade selecionada
  comunidade: string | null; // Novo: null = cidade inteira
  quantidade: number;
  coordenador_id: string | null;
  coordenador_nome: string | null;
  endereco_ids: string[];
  sugestaoIA?: {...};
}
```

#### Fluxo de Seleção (Etapa 2)

**1. Select UF:**
- Lista fixa de 27 estados
- Ao selecionar, reseta cidade e comunidade

**2. Select Cidade:**
- Carrega cidades da UF selecionada
- Combina `enderecos` + `cidades_cobertura`
- Opção especial: "Adicionar nova cidade"
- Ao selecionar "Adicionar nova cidade":
  - Mostra campo de texto para digitar nome
  - Salva em `cidades_cobertura` ao adicionar grupo
  - Grupo criado sem comunidades (cidade nova)

**3. Select Comunidade:**
- Só aparece se cidade != "NOVA_CIDADE"
- Primeira opção: "Cidade inteira (todas as comunidades)"
- Lista comunidades reais da tabela `enderecos`
- Ao selecionar "Cidade inteira":
  - `grupo.comunidade = null`
  - Campanha cobre todas as comunidades da cidade
  - Endereços futuros entram automaticamente

**4. Quantidade de Pontos:**
- Input numérico
- Quantidade desejada de instalações

### 4. Integração com IA

A IA recebe contexto diferente baseado na seleção:

#### Caso 1: Comunidade Específica com Endereços
```
Região: Rocinha, Rio de Janeiro/RJ
Endereços disponíveis: [lista de endereços]
Coordenadores: [lista com territórios]

IA retorna:
- coordenador_id
- endereco_ids (array com IDs)
- justificativa
```

#### Caso 2: Cidade Inteira com Endereços
```
Região: Rio de Janeiro/RJ (cidade inteira)
Endereços disponíveis: [todos da cidade]
Coordenadores: [lista com territórios]

IA retorna:
- coordenador_id
- endereco_ids (array com IDs de várias comunidades)
- justificativa
```

#### Caso 3: Região Sem Endereços Cadastrados
```
Região: Nova Cidade/UF (sem endereços)
Coordenadores: [lista com territórios]

IA retorna:
- coordenador_id (melhor match por território)
- endereco_ids: [] (vazio)
- justificativa: "Não há endereços cadastrados. Coordenador deverá mapear em campo."
```

### 5. Salvamento da Campanha

**Campo `cidade` na tabela `campanhas`:**
- Formato: "Rocinha, Rio de Janeiro/RJ; São Paulo/SP (cidade inteira)"
- Separa múltiplos grupos com ";"
- Indica "cidade inteira" quando aplicável

**Criação de Instalações:**
- Se `grupo.endereco_ids.length > 0`: cria instalações com status "pendente"
- Se `grupo.endereco_ids.length === 0`: não cria instalações (mapear em campo)

**Vinculação em `campanha_coordenadores`:**
- Sempre cria registro
- `endereco_ids` pode ser array vazio (mapear em campo)

**Notificações:**
- Com endereços: "X pontos atribuídos"
- Sem endereços: "Você deverá mapear e cadastrar X pontos durante o trabalho de campo"

### 6. Comportamento "Cidade Inteira"

Quando admin seleciona "Cidade inteira":

**No momento da criação:**
- `grupo.comunidade = null`
- Busca TODOS os endereços disponíveis da cidade
- IA pode sugerir endereços de múltiplas comunidades

**Comportamento futuro (não implementado ainda):**
- Quando coordenador cadastrar novo endereço naquela cidade
- Sistema deve verificar se há campanha ativa com "cidade inteira"
- Vincular automaticamente o novo endereço à campanha

## Arquivos Criados/Modificados

### Criados:
- `supabase/migrations/20260225180000_add_cidades_cobertura.sql`
- `src/hooks/useRegioes.ts`
- `SELECAO_CASCATA_REGIOES.md`

### Modificados:
- `src/components/NovaCampanhaModalV2.tsx`
  - Interface `Grupo` atualizada
  - Novos selects em cascata
  - Lógica de adicionar cidade
  - Prompt IA atualizado
  - Salvamento atualizado
- `src/integrations/supabase/types.ts`
  - Adicionada tabela `cidades_cobertura`

## Fluxo de Uso

### Cenário 1: Campanha em Comunidade Existente
1. Admin seleciona UF: "RJ"
2. Admin seleciona Cidade: "Rio de Janeiro"
3. Admin seleciona Comunidade: "Rocinha"
4. Admin define quantidade: 10
5. Admin clica "Sugerir com IA"
6. IA analisa endereços da Rocinha e sugere coordenador + endereços
7. Admin aceita ou ajusta
8. Campanha criada com 10 instalações pendentes

### Cenário 2: Campanha em Cidade Inteira
1. Admin seleciona UF: "SP"
2. Admin seleciona Cidade: "São Paulo"
3. Admin seleciona: "Cidade inteira (todas as comunidades)"
4. Admin define quantidade: 50
5. Admin clica "Sugerir com IA"
6. IA analisa TODOS os endereços de SP e sugere coordenador + mix de endereços
7. Admin aceita
8. Campanha criada com 50 instalações em várias comunidades

### Cenário 3: Campanha em Cidade Nova
1. Admin seleciona UF: "MG"
2. Admin seleciona: "Adicionar nova cidade"
3. Admin digita: "Contagem"
4. Admin define quantidade: 20
5. Admin clica "Sugerir com IA"
6. IA informa que não há endereços e sugere coordenador para mapear
7. Admin aceita
8. Campanha criada SEM instalações
9. Coordenador recebe notificação para mapear 20 pontos em campo

## Próximos Passos (Não Implementados)

### 1. Vinculação Automática de Novos Endereços
Quando coordenador cadastra novo endereço:
- Verificar se há campanha ativa com "cidade inteira" naquela cidade
- Se sim, criar instalação automaticamente
- Notificar coordenador sobre novo ponto vinculado

### 2. Filtro de Coordenadores por Território
No select manual de coordenador:
- Mostrar apenas coordenadores que cobrem a região selecionada
- Indicar visualmente o match de território

### 3. Validação de Quantidade
- Alertar se quantidade solicitada > endereços disponíveis
- Sugerir ajuste ou mapear diferença em campo

### 4. Histórico de Cidades Adicionadas
- Página para visualizar cidades em `cidades_cobertura`
- Permitir edição/remoção de cidades sem endereços

## Tecnologias

- React Query para cache e queries
- Supabase para banco de dados
- Google Gemini AI para sugestões
- shadcn/ui para componentes (Select, Input, etc)
- TypeScript para type safety
