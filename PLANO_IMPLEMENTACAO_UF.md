# Plano de Implementação: Coordenador por UF

## Status: PRONTO PARA APLICAR

## Arquivos Criados

### 1. Migration do Banco de Dados
**Arquivo**: `supabase/migrations/20260226010000_change_territorios_to_uf.sql`

**O que faz**:
- Remove função antiga `coordenador_cobre_endereco()`
- Cria nova função `coordenador_cobre_uf()`
- Migra dados existentes de cidades/comunidades para UFs
- Atualiza estrutura JSONB de `{"cidades": [], "comunidades": []}` para `{"ufs": []}`

**Como aplicar**:
```bash
# Conectar ao Supabase e executar a migration
supabase db push
```

### 2. Novo Componente de Edição
**Arquivo**: `src/components/TerritoriosEditorUF.tsx`

**O que faz**:
- Componente simplificado que trabalha apenas com UFs
- Interface limpa: dropdown de UF + botão adicionar
- Mostra badges dos estados adicionados
- Permite remover estados

## Próximos Passos

### Passo 1: Aplicar Migration (CRÍTICO)
```bash
cd supabase
supabase db push
```

Verificar se migration foi aplicada com sucesso:
```sql
-- Verificar se função existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'coordenador_cobre_uf';

-- Verificar estrutura de territorios
SELECT id, nome, territorios 
FROM profiles 
WHERE territorios IS NOT NULL 
LIMIT 5;
```

### Passo 2: Atualizar Types do TypeScript

**Arquivo**: `src/hooks/useTerritorios.ts`

Mudar de:
```typescript
export interface Territorios {
  cidades: string[];
  comunidades: string[];
}
```

Para:
```typescript
export interface Territorios {
  ufs: string[];
}
```

### Passo 3: Atualizar Users.tsx

**Mudanças necessárias**:

1. Importar novo componente:
```typescript
import { TerritoriosEditorUF } from "@/components/TerritoriosEditorUF";
```

2. Atualizar interface User:
```typescript
interface User {
  // ...
  territorios: { ufs: string[] } | null;
}
```

3. Atualizar formData inicial:
```typescript
const [formData, setFormData] = useState({
  // ...
  territorios: { ufs: [] },
});
```

4. Substituir `<TerritoriosEditor>` por `<TerritoriosEditorUF>` (2 lugares)

5. Atualizar exibição de territórios na tabela:
```typescript
<TableCell>
  {user.role === "coordenador" ? (
    <div className="flex flex-wrap gap-1">
      {user.territorios?.ufs?.map((uf) => (
        <Badge key={uf} variant="default" className="bg-blue-500 text-xs">
          {uf}
        </Badge>
      ))}
      {(!user.territorios?.ufs?.length) && (
        <span className="text-xs text-muted-foreground">
          Sem território
        </span>
      )}
    </div>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  )}
</TableCell>
```

### Passo 4: Atualizar NovaCampanhaModalV2.tsx

**Mudanças no filtro de coordenadores**:

Localizar a função que filtra coordenadores e mudar de:
```typescript
// ANTES: Filtrava por comunidade
const coordenadoresFiltrados = coordenadores.filter((coord) => {
  return coord.territorios?.comunidades?.includes(comunidadeSelecionada);
});
```

Para:
```typescript
// DEPOIS: Filtrar por UF
const coordenadoresFiltrados = coordenadores.filter((coord) => {
  return coord.territorios?.ufs?.includes(ufSelecionada);
});
```

### Passo 5: Adicionar Funcionalidade de Trocar Coordenador

**Arquivo**: `src/pages/CampaignDetail.tsx`

**Novo componente**: `src/components/TrocarCoordenadorModal.tsx`

```typescript
interface TrocarCoordenadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoId: string;
  coordenadorAtualId: string;
  ufGrupo: string;
  onSuccess: () => void;
}
```

**Lógica**:
1. Buscar coordenadores que cobrem a UF do grupo
2. Mostrar lista de coordenadores disponíveis
3. Ao selecionar, atualizar `grupos_campanha.coordenador_id`
4. Mostrar toast de sucesso
5. Recarregar dados da campanha

### Passo 6: Atualizar Dashboard do Coordenador

**Arquivo**: `src/hooks/useCoordenadorDashboard.ts`

Atualizar queries para filtrar por UF em vez de comunidade:

```typescript
// ANTES
WHERE coordenador_cobre_endereco(
  profiles.territorios,
  enderecos.cidade,
  enderecos.comunidade
)

// DEPOIS
WHERE coordenador_cobre_uf(
  profiles.territorios,
  enderecos.uf
)
```

## Testes Necessários

### Teste 1: Cadastro de Coordenador
- [ ] Criar novo coordenador
- [ ] Adicionar UF "SP"
- [ ] Verificar se salva corretamente no banco
- [ ] Verificar se aparece na listagem

### Teste 2: Edição de Territórios
- [ ] Editar coordenador existente
- [ ] Adicionar nova UF
- [ ] Remover UF existente
- [ ] Verificar se atualiza corretamente

### Teste 3: Criação de Campanha
- [ ] Criar campanha para UF "SP"
- [ ] Verificar se mostra apenas coordenadores de SP
- [ ] Selecionar coordenador
- [ ] Verificar se vincula corretamente

### Teste 4: Trocar Coordenador
- [ ] Abrir campanha existente
- [ ] Clicar em "Trocar Coordenador"
- [ ] Selecionar novo coordenador
- [ ] Verificar se atualiza corretamente

### Teste 5: Dashboard Coordenador
- [ ] Logar como coordenador
- [ ] Verificar se vê apenas campanhas da sua UF
- [ ] Verificar se vê apenas endereços da sua UF

## Riscos e Mitigações

### Risco 1: Dados Existentes
**Problema**: Coordenadores já cadastrados com comunidades
**Mitigação**: Migration tenta extrair UF automaticamente dos endereços

### Risco 2: Campanhas Ativas
**Problema**: Campanhas em andamento podem ter coordenadores com dados antigos
**Mitigação**: Migration preserva vínculos existentes, apenas muda estrutura

### Risco 3: Queries Antigas
**Problema**: Código que ainda usa `coordenador_cobre_endereco()`
**Mitigação**: Buscar e substituir todas as ocorrências

## Comandos Úteis

### Buscar usos da função antiga
```bash
grep -r "coordenador_cobre_endereco" src/
grep -r "cidades.*comunidades" src/
```

### Verificar estrutura no banco
```sql
-- Ver todos os coordenadores e seus territórios
SELECT 
  p.nome,
  p.territorios,
  ur.role
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

### Testar função nova
```sql
SELECT coordenador_cobre_uf(
  '{"ufs": ["SP", "RJ"]}'::jsonb,
  'SP'
); -- Deve retornar TRUE
```

## Ordem de Implementação Recomendada

1. ✅ Criar migration (FEITO)
2. ✅ Criar componente TerritoriosEditorUF (FEITO)
3. ⏳ Aplicar migration no banco
4. ⏳ Atualizar types TypeScript
5. ⏳ Atualizar Users.tsx
6. ⏳ Atualizar NovaCampanhaModalV2.tsx
7. ⏳ Testar fluxo completo
8. ⏳ Implementar trocar coordenador
9. ⏳ Atualizar dashboard coordenador

## Notas Importantes

- Manter `TerritoriosEditor.tsx` antigo por enquanto (pode ser útil para rollback)
- Fazer backup do banco antes de aplicar migration
- Testar em ambiente de desenvolvimento primeiro
- Comunicar mudança para o time antes de aplicar em produção
