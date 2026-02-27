# Correção: Bug de Territórios

## 🐛 Problemas Encontrados

### 1. Usuário criado automaticamente ao selecionar comunidade
**Causa**: O `useEffect` no `TerritoriosEditor` estava disparando `onChange` durante a inicialização do componente, o que fazia o formulário pai submeter automaticamente.

**Solução**: Adicionado flag `inicializado` para evitar disparar `onChange` durante a inicialização.

### 2. Territórios não aparecem na listagem
**Causa**: Possível problema no salvamento ou na query de busca.

**Solução**: Adicionados logs detalhados para debug em:
- `handleCreateUser()` - Ver o que está sendo salvo
- `fetchUsers()` - Ver o que está sendo buscado

---

## ✅ Correções Aplicadas

### Arquivo: `src/components/TerritoriosEditor.tsx`

#### Antes:
```typescript
export function TerritoriosEditor({ value, onChange, disabled }: TerritoriosEditorProps) {
  const [territorios, setTerritorios] = useState<Territorio[]>([]);
  
  // ...
  
  // Notificar mudanças no formato antigo
  useEffect(() => {
    const cidades = territorios
      .filter((t) => t.tipo === "cidade_inteira")
      .map((t) => t.cidade);
    
    const comunidades = territorios
      .filter((t) => t.tipo === "comunidade_especifica")
      .map((t) => t.comunidade || "");
    
    onChange({ cidades, comunidades }); // ❌ Dispara na inicialização
  }, [territorios]);
```

#### Depois:
```typescript
export function TerritoriosEditor({ value, onChange, disabled }: TerritoriosEditorProps) {
  const [territorios, setTerritorios] = useState<Territorio[]>([]);
  const [inicializado, setInicializado] = useState(false); // ✅ Flag de controle
  
  // ...
  
  // Converter value inicial para territorios
  useEffect(() => {
    // ... código de inicialização ...
    setInicializado(true); // ✅ Marca como inicializado
  }, []);
  
  // Notificar mudanças no formato antigo (apenas após inicialização)
  useEffect(() => {
    if (!inicializado) return; // ✅ Não dispara durante inicialização
    
    const cidades = territorios
      .filter((t) => t.tipo === "cidade_inteira")
      .map((t) => t.cidade);
    
    const comunidades = territorios
      .filter((t) => t.tipo === "comunidade_especifica")
      .map((t) => t.comunidade || "");
    
    onChange({ cidades, comunidades });
  }, [territorios, inicializado]);
```

### Arquivo: `src/pages/Users.tsx`

Adicionados logs detalhados em `handleCreateUser()`:

```typescript
console.log("🔵 [CRIAR USUÁRIO] Iniciando...");
console.log("  formData:", formData);
console.log("  territorios:", formData.territorios);

// ... após criar usuário ...
console.log("✅ [AUTH] Usuário criado:", authData.user?.id);

// ... após inserir role ...
console.log("✅ [ROLE] Role inserida com sucesso");

// ... ao salvar territórios ...
console.log("🗺️ [TERRITORIOS] Salvando territórios:", updateData.territorios);

// ... após atualizar profile ...
console.log("✅ [PROFILE] Profile atualizado:", profileData);
```

---

## 🔍 Como Testar Agora

### Teste 1: Verificar se usuário não é criado automaticamente

1. Ir para **Usuários** → **Novo Usuário**
2. Preencher nome, email, telefone, senha
3. Selecionar perfil "Coordenador"
4. Selecionar UF: "SP"
5. Selecionar Cidade: "São Paulo"
6. Selecionar Comunidade: "Heliópolis"
7. **NÃO clicar em "Adicionar"** ainda
8. Verificar que o usuário **NÃO foi criado** automaticamente
9. Clicar em "Adicionar Território"
10. Verificar que badge verde "Heliópolis" aparece
11. Agora sim, clicar em "Criar Usuário"

**Resultado esperado**: Usuário só é criado quando você clica em "Criar Usuário"

### Teste 2: Verificar se territórios são salvos

1. Abrir console do navegador (F12)
2. Criar novo usuário coordenador com território
3. Verificar logs no console:

```
🔵 [CRIAR USUÁRIO] Iniciando...
  formData: { nome: "...", territorios: { cidades: [], comunidades: ["Heliópolis"] } }
  territorios: { cidades: [], comunidades: ["Heliópolis"] }
✅ [AUTH] Usuário criado: abc-123-def
✅ [ROLE] Role inserida com sucesso
🗺️ [TERRITORIOS] Salvando territórios: { cidades: [], comunidades: ["Heliópolis"] }
✅ [PROFILE] Profile atualizado: [{ id: "abc-123-def", territorios: {...} }]
```

4. Verificar na listagem se badge verde "Heliópolis" aparece

### Teste 3: Verificar no banco de dados

Execute o script `verificar-territorios.sql` no Supabase SQL Editor:

```sql
SELECT 
  id,
  nome,
  email,
  telefone,
  territorios,
  criado_em
FROM profiles 
WHERE email = 'cloclo@df.com';
```

**Resultado esperado**:
```
territorios: {"cidades": [], "comunidades": ["Heliópolis"]}
```

---

## 🐛 Se Territórios Ainda Não Aparecerem

### Cenário 1: Territórios salvos mas não aparecem na listagem

**Verificar no console**:
```
📥 [BUSCANDO USUÁRIOS]
📊 [PROFILES DO BANCO]: [{ id: "...", territorios: {...} }]
✅ Territórios de João: { cidades: [], comunidades: ["Heliópolis"] }
```

Se aparecer `⚠️ João não tem territórios`, mas no banco tem, o problema é na query.

**Solução**: Verificar se a query está buscando o campo `territorios`:
```typescript
.select("id, email, nome, telefone, criado_em, territorios")
```

### Cenário 2: Territórios não são salvos no banco

**Verificar no console**:
```
🗺️ [TERRITORIOS] Salvando territórios: { cidades: [], comunidades: [] }
```

Se aparecer vazio, o problema é no `TerritoriosEditor`.

**Solução**: Verificar se o componente está notificando mudanças corretamente.

### Cenário 3: Erro ao salvar

**Verificar no console**:
```
❌ [ERRO] Ao criar usuário: new row violates row-level security policy
```

**Solução**: Executar novamente `fix-user-creation-policies.sql`

---

## 📋 Checklist de Verificação

Após aplicar as correções:

- [ ] Usuário NÃO é criado automaticamente ao selecionar comunidade
- [ ] Consegue adicionar múltiplos territórios antes de criar usuário
- [ ] Badge verde aparece ao adicionar comunidade
- [ ] Badge azul aparece ao adicionar cidade inteira
- [ ] Console mostra logs de salvamento
- [ ] Territórios aparecem na listagem após criar usuário
- [ ] Territórios estão salvos no banco (verificar com SQL)

---

## 🎯 Próximos Passos

1. **Testar criação de usuário** com os logs habilitados
2. **Copiar logs do console** e verificar se territórios estão sendo salvos
3. **Executar SQL de verificação** para confirmar dados no banco
4. **Se ainda não funcionar**, compartilhar os logs para análise

---

## 📞 Informações para Debug

Se territórios ainda não aparecerem, precisamos de:

1. **Logs do console** ao criar usuário
2. **Resultado do SQL** `verificar-territorios.sql`
3. **Screenshot** da listagem de usuários
4. **Email do usuário criado** para verificar no banco

---

**Data**: 25 de fevereiro de 2026
**Versão**: 1.1
