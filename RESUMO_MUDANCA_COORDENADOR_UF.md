# Resumo: Mudança de Coordenador por UF

## O Que Mudou?

**ANTES**: Coordenador vinculado a cidades e comunidades específicas
**DEPOIS**: Coordenador vinculado apenas a estados (UF)

## Por Que?

Feedback do time de operações:
- Mais simples de gerenciar
- Coordenador cobre estado inteiro
- Facilita escalabilidade
- Permite trocar coordenador dentro da campanha

## Arquivos Criados

1. **Migration do Banco**: `supabase/migrations/20260226010000_change_territorios_to_uf.sql`
   - Muda estrutura de territorios
   - Migra dados existentes
   - Cria função `coordenador_cobre_uf()`

2. **Novo Componente**: `src/components/TerritoriosEditorUF.tsx`
   - Interface simplificada
   - Trabalha apenas com UF
   - Dropdown + badges

3. **Documentação**:
   - `MUDANCA_COORDENADOR_POR_ESTADO.md` - Contexto completo
   - `PLANO_IMPLEMENTACAO_UF.md` - Passo a passo técnico

## Próximos Passos (Ordem)

### 1. Aplicar Migration (PRIMEIRO!)
```bash
cd supabase
supabase db push
```

### 2. Atualizar Código Frontend
- Atualizar `src/hooks/useTerritorios.ts` (mudar interface)
- Atualizar `src/pages/Users.tsx` (usar novo componente)
- Atualizar `src/components/NovaCampanhaModalV2.tsx` (filtrar por UF)

### 3. Implementar Trocar Coordenador
- Criar modal em `CampaignDetail.tsx`
- Permitir trocar coordenador de um grupo

### 4. Testar Tudo
- Cadastrar coordenador com UF
- Criar campanha
- Filtrar coordenadores por UF
- Trocar coordenador

## Impacto

### Banco de Dados
- Coluna `territorios` muda de `{"cidades": [], "comunidades": []}` para `{"ufs": []}`
- Dados existentes são migrados automaticamente

### Interface
- Formulário de coordenador fica mais simples (só UF)
- Filtro na campanha fica por UF
- Nova funcionalidade: trocar coordenador

### Coordenadores Existentes
- Dados serão migrados automaticamente
- Se tiverem cidades/comunidades, migration extrai a UF

## Riscos

1. **Dados existentes**: Migration tenta migrar automaticamente, mas pode precisar ajuste manual
2. **Campanhas ativas**: Vínculos são preservados, mas estrutura muda
3. **Código antigo**: Precisa atualizar todas as referências

## Recomendações

1. Fazer backup do banco antes
2. Testar em dev primeiro
3. Comunicar time antes de aplicar em prod
4. Manter código antigo por alguns dias (rollback)

## Dúvidas?

Leia os documentos completos:
- `MUDANCA_COORDENADOR_POR_ESTADO.md` - Contexto e requisitos
- `PLANO_IMPLEMENTACAO_UF.md` - Implementação técnica detalhada
