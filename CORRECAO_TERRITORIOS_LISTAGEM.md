# Correção: Territórios não aparecem na listagem

## Problema
Após salvar territórios de um coordenador, eles não apareciam imediatamente na listagem de usuários.

## Causa
Timing entre a mutation do React Query e o reload dos dados. A invalidação de queries é assíncrona e pode não ter completado antes de `fetchUsers()` ser chamado.

## Solução Aplicada

### 1. Timeout antes de recarregar
```typescript
// src/pages/Users.tsx - handleSaveTerritorios()
setTimeout(() => {
  fetchUsers();
}, 500);
```

Aguarda 500ms após a mutation para garantir que:
- A invalidação de queries completou
- O banco de dados foi atualizado
- Os dados estão prontos para serem buscados novamente

### 2. Console.log para debug
```typescript
// src/pages/Users.tsx - fetchUsers()
if (user.territorios) {
  console.log(`Territórios de ${user.nome}:`, user.territorios);
}
```

Permite verificar no console do navegador se os territórios estão sendo carregados corretamente.

## Como Testar

1. Abrir página de Usuários
2. Clicar em "Editar" (ícone de lápis) em um coordenador
3. Adicionar territórios (cidades e/ou comunidades)
4. Clicar em "Salvar"
5. Verificar no console do navegador se os territórios foram carregados
6. Verificar na coluna "Território" se as badges aparecem:
   - 🔵 Azul para cidades
   - 🟢 Verde para comunidades

## Estrutura dos Dados

```typescript
interface Territorios {
  cidades: string[];      // Ex: ["São Paulo", "Rio De Janeiro"]
  comunidades: string[];  // Ex: ["Heliópolis", "Paraisópolis"]
}
```

## Exibição na UI

- Cidades: Badge azul (`bg-blue-500`)
- Comunidades: Badge verde (`bg-green-500`)
- Sem território: Texto cinza "Sem território"
- Não coordenador: Traço "-"

## Arquivos Modificados

- `src/pages/Users.tsx` - Adicionado timeout e console.log

## Status

✅ Correção aplicada
🔍 Aguardando teste do usuário
