# TerritoriosEditor - Seleção em Cascata

## Mudanças Implementadas

### Antes (Checkboxes)
- Lista de todas as cidades com checkboxes
- Lista de todas as comunidades com checkboxes
- Sem contexto de UF
- Difícil de encontrar cidades/comunidades específicas
- Não mostrava relação UF → Cidade → Comunidade

### Depois (Cascata Obrigatória)
- ✅ Select UF (27 estados)
- ✅ Select Cidade (filtrado por UF)
- ✅ Select Comunidade (filtrado por Cidade)
- ✅ Opção "Cidade inteira"
- ✅ Opção "Cadastrar nova cidade"
- ✅ Opção "Cadastrar nova comunidade"
- ✅ Tags coloridas: 🔵 cidade inteira, 🟢 comunidade específica
- ✅ Botão X para remover

## Fluxo de Uso

### 1. Selecionar UF
```
Select: [Selecione a UF ▼]
Opções: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
```

### 2. Selecionar Cidade (após UF)
```
Select: [Selecione a cidade ▼]
Opções:
- São Paulo
- Guarulhos
- Campinas
- ...
- [+] Cadastrar nova cidade
```

Se selecionar "Cadastrar nova cidade":
```
Input: [Digite o nome da cidade]
```

### 3. Selecionar Comunidade (após Cidade)
```
Select: [Selecione a comunidade ▼]
Opções:
- 🔵 Cidade inteira (todas as comunidades)
- 🟢 Heliópolis
- 🟢 Paraisópolis
- 🟢 Rocinha
- ...
- [+] Cadastrar nova comunidade
```

Se selecionar "Cadastrar nova comunidade":
```
Input: [Digite o nome da comunidade]
```

### 4. Adicionar Território
```
Botão: [✓ Adicionar Território]
```

### 5. Território Adicionado
```
Tags:
🔵 São Paulo/SP (cidade inteira) [X]
🟢 Heliópolis, São Paulo/SP [X]
🟢 Rocinha, Rio de Janeiro/RJ [X]
```

## Interface do Componente

### Props
```typescript
interface TerritoriosEditorProps {
  value: {
    cidades: string[];      // ["São Paulo", "Rio de Janeiro"]
    comunidades: string[];  // ["Heliópolis", "Rocinha"]
  };
  onChange: (territorios: { cidades: string[]; comunidades: string[] }) => void;
  disabled?: boolean;
}
```

### Estado Interno
```typescript
interface Territorio {
  id: string;
  uf: string;
  cidade: string;
  comunidade: string | null; // null = cidade inteira
  tipo: "cidade_inteira" | "comunidade_especifica";
}
```

## Exemplos de Uso

### Exemplo 1: Adicionar Cidade Inteira
```
1. Selecionar UF: "SP"
2. Selecionar Cidade: "São Paulo"
3. Selecionar Comunidade: "🔵 Cidade inteira (todas as comunidades)"
4. Clicar "Adicionar Território"

Resultado:
🔵 São Paulo/SP (cidade inteira) [X]
```

### Exemplo 2: Adicionar Comunidade Específica
```
1. Selecionar UF: "RJ"
2. Selecionar Cidade: "Rio de Janeiro"
3. Selecionar Comunidade: "🟢 Rocinha"
4. Clicar "Adicionar Território"

Resultado:
🟢 Rocinha, Rio de Janeiro/RJ [X]
```

### Exemplo 3: Cadastrar Nova Cidade
```
1. Selecionar UF: "MG"
2. Selecionar Cidade: "[+] Cadastrar nova cidade"
3. Campo aparece: "Digite o nome da cidade"
4. Digitar: "Contagem"
5. Selecionar Comunidade: "🔵 Cidade inteira"
6. Clicar "Adicionar Território"

Resultado:
🔵 Contagem/MG (cidade inteira) [X]
```

### Exemplo 4: Cadastrar Nova Comunidade
```
1. Selecionar UF: "SP"
2. Selecionar Cidade: "São Paulo"
3. Selecionar Comunidade: "[+] Cadastrar nova comunidade"
4. Campo aparece: "Digite o nome da comunidade"
5. Digitar: "Nova Comunidade"
6. Clicar "Adicionar Território"

Resultado:
🟢 Nova Comunidade, São Paulo/SP [X]
```

## Validações

### Botão "Adicionar Território" Desabilitado Quando:
- ❌ UF não selecionada
- ❌ Cidade não selecionada (e não digitada)
- ❌ "Cadastrar nova cidade" selecionado mas campo vazio
- ❌ "Cadastrar nova comunidade" selecionado mas campo vazio

### Botão "Adicionar Território" Habilitado Quando:
- ✅ UF selecionada
- ✅ Cidade selecionada (ou nova cidade digitada)
- ✅ Comunidade selecionada (ou nova comunidade digitada, ou cidade inteira)

## Comportamento

### Resetar Formulário Após Adicionar
Após clicar "Adicionar Território":
- UF volta para vazio
- Cidade volta para vazio
- Comunidade volta para vazio
- Campos de nova cidade/comunidade são limpos
- Formulário pronto para adicionar outro território

### Prevenir Duplicatas
O sistema verifica se já existe um território com:
- Mesma UF
- Mesma Cidade
- Mesma Comunidade (ou ambos cidade inteira)

Se já existir, não adiciona novamente.

### Remover Território
Clicar no [X] de uma tag remove o território da lista.

## Compatibilidade com Formato Antigo

O componente mantém compatibilidade com o formato antigo:

### Input (formato antigo):
```typescript
{
  cidades: ["São Paulo", "Rio de Janeiro"],
  comunidades: ["Heliópolis", "Rocinha"]
}
```

### Output (formato antigo):
```typescript
{
  cidades: ["São Paulo", "Rio de Janeiro"],
  comunidades: ["Heliópolis", "Rocinha"]
}
```

### Conversão Interna:
O componente converte internamente para o novo formato com UF, mas mantém a interface externa compatível.

## Integração com useRegioes

O componente usa os hooks de `useRegioes.ts`:

```typescript
import { 
  UFS_BRASIL,                    // Lista de 27 UFs
  useCidadesPorUF,               // Busca cidades por UF
  useComunidadesPorCidade        // Busca comunidades por cidade
} from "@/hooks/useRegioes";
```

### useCidadesPorUF(uf)
- Busca cidades únicas da tabela `enderecos`
- Filtra por UF
- Remove duplicatas
- Ordena alfabeticamente

### useComunidadesPorCidade(uf, cidade)
- Busca comunidades únicas da tabela `enderecos`
- Filtra por UF e Cidade
- Remove duplicatas
- Ordena alfabeticamente

## Estilização

### Tags de Território
```css
🔵 Cidade Inteira:
- Cor: bg-blue-500 hover:bg-blue-600
- Texto: "Cidade/UF (cidade inteira)"

🟢 Comunidade Específica:
- Cor: bg-green-500 hover:bg-green-600
- Texto: "Comunidade, Cidade/UF"
```

### Botão Remover
```css
- Ícone: X (lucide-react)
- Hover: bg-white/20
- Tamanho: w-3 h-3
```

### Formulário de Adição
```css
- Background: bg-muted/10
- Border: border rounded-lg
- Padding: p-4
```

## Páginas que Usam o Componente

### 1. /usuarios (Editar Coordenador)
Admin pode configurar territórios de coordenadores.

### 2. /perfil (Visualizar Próprio Território)
Coordenador pode visualizar seu território (disabled=true).

## Melhorias Futuras

### 1. Validação de Sobreposição
Alertar se adicionar comunidade específica quando cidade inteira já está coberta.

### 2. Busca/Filtro
Adicionar campo de busca para encontrar cidades/comunidades rapidamente.

### 3. Importação em Massa
Permitir importar lista de territórios via CSV ou JSON.

### 4. Visualização no Mapa
Mostrar territórios cobertos em um mapa interativo.

### 5. Estatísticas
Mostrar quantos endereços cada território cobre.

## Testes

### Teste 1: Adicionar Cidade Inteira
```
1. Abrir /usuarios
2. Editar coordenador
3. Selecionar UF: "SP"
4. Selecionar Cidade: "São Paulo"
5. Selecionar: "Cidade inteira"
6. Adicionar
7. ✅ Tag azul aparece: "🔵 São Paulo/SP (cidade inteira)"
```

### Teste 2: Adicionar Comunidade
```
1. Selecionar UF: "RJ"
2. Selecionar Cidade: "Rio de Janeiro"
3. Selecionar Comunidade: "Rocinha"
4. Adicionar
5. ✅ Tag verde aparece: "🟢 Rocinha, Rio de Janeiro/RJ"
```

### Teste 3: Remover Território
```
1. Clicar no [X] de uma tag
2. ✅ Tag desaparece
3. ✅ onChange é chamado com lista atualizada
```

### Teste 4: Cadastrar Nova Cidade
```
1. Selecionar UF: "MG"
2. Selecionar: "Cadastrar nova cidade"
3. ✅ Campo de texto aparece
4. Digitar: "Contagem"
5. Selecionar: "Cidade inteira"
6. Adicionar
7. ✅ Tag aparece: "🔵 Contagem/MG (cidade inteira)"
```

## Conclusão

✅ Seleção em cascata obrigatória implementada
✅ UF → Cidade → Comunidade
✅ Opções de cadastrar nova cidade/comunidade
✅ Tags coloridas com emojis
✅ Botão X para remover
✅ Compatível com formato antigo
✅ Integrado com useRegioes
✅ Validações e prevenção de duplicatas

O componente está pronto para uso!
