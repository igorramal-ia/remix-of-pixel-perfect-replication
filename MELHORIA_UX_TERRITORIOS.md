# Melhoria UX: Adicionar Múltiplas Comunidades

## Problema Atual
Ao adicionar territórios, o usuário precisa:
1. Selecionar UF
2. Selecionar Cidade
3. Selecionar Comunidade
4. Clicar em "Adicionar"
5. **Repetir tudo** para adicionar outra comunidade da mesma cidade

Isso é repetitivo e frustrante.

## Solução Proposta

### Opção 1: Checkbox para Múltiplas Comunidades (Mais Simples)

Permitir selecionar múltiplas comunidades antes de adicionar:

```typescript
const [comunidadesSelecionadas, setComunidadesSelecionadas] = useState<string[]>([]);

// No render
<div className="space-y-2 max-h-48 overflow-y-auto">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="cidade-inteira"
      checked={comunidadesSelecionadas.includes("CIDADE_INTEIRA")}
      onChange={(e) => {
        if (e.target.checked) {
          setComunidadesSelecionadas(["CIDADE_INTEIRA"]);
        } else {
          setComunidadesSelecionadas([]);
        }
      }}
    />
    <label htmlFor="cidade-inteira">
      🔵 Cidade inteira (todas as comunidades)
    </label>
  </div>
  
  {comunidades?.map((comunidade) => (
    <div key={comunidade} className="flex items-center gap-2">
      <input
        type="checkbox"
        id={`com-${comunidade}`}
        checked={comunidadesSelecionadas.includes(comunidade)}
        onChange={(e) => {
          if (e.target.checked) {
            setComunidadesSelecionadas([...comunidadesSelecionadas, comunidade]);
          } else {
            setComunidadesSelecionadas(
              comunidadesSelecionadas.filter((c) => c !== comunidade)
            );
          }
        }}
        disabled={comunidadesSelecionadas.includes("CIDADE_INTEIRA")}
      />
      <label htmlFor={`com-${comunidade}`}>
        🟢 {comunidade}
      </label>
    </div>
  ))}
</div>

<Button
  onClick={() => {
    // Adicionar todas as comunidades selecionadas de uma vez
    comunidadesSelecionadas.forEach((comunidade) => {
      const novoTerritorio = {
        id: `${Date.now()}-${Math.random()}`,
        uf: ufSelecionada,
        cidade: cidadeSelecionada,
        comunidade: comunidade === "CIDADE_INTEIRA" ? null : comunidade,
        tipo: comunidade === "CIDADE_INTEIRA" ? "cidade_inteira" : "comunidade_especifica",
      };
      // Adicionar ao estado
    });
    
    // Limpar seleção mas manter UF e Cidade
    setComunidadesSelecionadas([]);
  }}
>
  Adicionar {comunidadesSelecionadas.length} Território(s)
</Button>
```

### Opção 2: Manter UF e Cidade após Adicionar (Mais Rápido)

Não resetar UF e Cidade após adicionar, apenas a comunidade:

```typescript
const handleAdicionarTerritorio = () => {
  // ... adicionar território ...
  
  // NÃO resetar UF e Cidade
  // setUfSelecionada("");
  // setCidadeSelecionada("");
  
  // Resetar apenas comunidade
  setComunidadeSelecionada("");
  setNovaComunidadeNome("");
  setMostrarNovaComunidade(false);
};
```

Adicionar botão "Trocar Cidade" para quando quiser mudar:

```typescript
<Button
  variant="outline"
  onClick={() => {
    setUfSelecionada("");
    setCidadeSelecionada("");
    setComunidadeSelecionada("");
  }}
>
  Trocar Cidade
</Button>
```

### Opção 3: Combo - Checkbox + Manter Seleção

Combinar as duas opções acima:
1. Permitir selecionar múltiplas comunidades com checkbox
2. Manter UF e Cidade após adicionar
3. Botão "Trocar Cidade" para resetar

## Implementação Recomendada

**Opção 2** é a mais simples e resolve 80% do problema com mudança mínima de código.

### Mudança no TerritoriosEditor.tsx

```typescript
const handleAdicionarTerritorio = () => {
  if (!ufSelecionada) return;

  let cidadeFinal = cidadeSelecionada;
  let comunidadeFinal = comunidadeSelecionada;

  // ... lógica de nova cidade/comunidade ...

  if (!cidadeFinal) return;

  const novoTerritorio: Territorio = {
    id: `${Date.now()}-${Math.random()}`,
    uf: ufSelecionada,
    cidade: cidadeFinal,
    comunidade: comunidadeFinal === "CIDADE_INTEIRA" ? null : comunidadeFinal || null,
    tipo: comunidadeFinal === "CIDADE_INTEIRA" || !comunidadeFinal 
      ? "cidade_inteira" 
      : "comunidade_especifica",
  };

  // Verificar se já existe
  const jaExiste = territorios.some(
    (t) =>
      t.uf === novoTerritorio.uf &&
      t.cidade === novoTerritorio.cidade &&
      t.comunidade === novoTerritorio.comunidade
  );

  if (!jaExiste) {
    setTerritorios([...territorios, novoTerritorio]);
  }

  // ✅ MUDANÇA: Não resetar UF e Cidade
  // setUfSelecionada("");
  // setCidadeSelecionada("");
  
  // Resetar apenas comunidade
  setComunidadeSelecionada("");
  setNovaComunidadeNome("");
  setMostrarNovaComunidade(false);
};
```

### Adicionar Botão "Trocar Cidade"

```typescript
{ufSelecionada && cidadeSelecionada && (
  <div className="flex gap-2">
    <Button
      onClick={handleAdicionarTerritorio}
      disabled={!comunidadeSelecionada && !novaComunidadeNome}
      className="flex-1"
    >
      <Check className="w-4 h-4 mr-2" />
      Adicionar Território
    </Button>
    <Button
      variant="outline"
      onClick={() => {
        setUfSelecionada("");
        setCidadeSelecionada("");
        setComunidadeSelecionada("");
      }}
    >
      Trocar Cidade
    </Button>
  </div>
)}
```

## Benefícios

### Opção 2 (Recomendada)
- ✅ Implementação simples (5 minutos)
- ✅ Resolve o problema principal
- ✅ UX muito melhor
- ✅ Não quebra nada existente

### Opção 1 (Checkbox)
- ✅ Permite adicionar múltiplas de uma vez
- ⚠️ Mais complexo de implementar
- ⚠️ Precisa de mais testes

## Próximos Passos

1. Implementar Opção 2 (manter UF/Cidade)
2. Testar fluxo completo
3. Se usuários pedirem, implementar Opção 1 (checkbox)

## Status

⏳ Aguardando implementação
📝 Documentação pronta
