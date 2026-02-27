# IA Temporariamente Desabilitada

## Motivo

A IA Gemini está cortando a resposta JSON no meio, causando erro de parsing:

```
"justificativa": "Endereços atribuídos ao coordenador Arlindo para gestão na região de Cantinho Do Cé
```

Falta o `}` final do JSON, resultando em `finishReason: 'MAX_TOKENS'`.

## Problema Técnico

Mesmo com:
- Prompt ultra-conciso
- `maxOutputTokens: 1024`
- `temperature: 0.3`
- Apenas 3 coordenadores enviados
- IDs em formato compacto

A resposta ainda é cortada em alguns casos.

## Solução Temporária

Botão "Sugerir com IA" foi desabilitado:

```typescript
<Button
  onClick={() => handleSugerirComIA(grupo.id)}
  disabled={true}
  variant="outline"
  className="w-full opacity-50 cursor-not-allowed"
  title="IA temporariamente desabilitada - use seleção manual"
>
  <Sparkles className="w-4 h-4 mr-2" />
  Sugerir com IA (em manutenção)
</Button>
```

## Funcionalidade Atual

Usuários devem usar **seleção manual de coordenador**:
- Dropdown filtra coordenadores que cobrem a região
- Ao selecionar, busca e vincula endereços automaticamente
- Mostra avisos se faltarem endereços

## Próximos Passos (Futuro)

Para corrigir a IA, considerar:

1. **Aumentar maxOutputTokens para 2048+**
   - Pode resolver, mas aumenta custo

2. **Simplificar ainda mais o prompt**
   - Enviar apenas 1 coordenador (pré-selecionado)
   - IA só escolhe endereços

3. **Usar modelo diferente**
   - `gemini-1.5-flash` em vez de `gemini-2.5-flash`
   - Verificar se tem melhor controle de tokens

4. **Fallback robusto**
   - Se JSON incompleto, tentar extrair o que for possível
   - Usar regex para pegar coordenador_id mesmo sem `}`

5. **Abordagem híbrida**
   - Backend faz a seleção (Python/Node)
   - Mais controle sobre parsing e fallback

## Arquivo Modificado

- `src/components/NovaCampanhaModalV2.tsx` - Botão desabilitado

## Status

✅ **IA DESABILITADA** - Seleção manual funcionando perfeitamente
