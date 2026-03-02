# 🔄 Limpar Cache e Testar

## Passos para testar:

### 1. Limpar cache do navegador
- Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
- Ou abra DevTools (F12) → Network → Marque "Disable cache"

### 2. Recarregar a página da campanha
- Acesse uma campanha
- Abra o Console do navegador (F12 → Console)

### 3. Verificar logs de debug
Você deve ver no console:

```
🔍 [DEBUG] Dados da campanha: {
  id: "...",
  nome: "...",
  gestor_id: "...",
  criado_por: "..."  ← Deve ter um UUID aqui
}

🔍 [DEBUG] Buscando criador: {
  criado_por: "...",
  gestor_id: "...",
  criadorId: "..."
}

🔍 [DEBUG] Nome do criador: "Nome da Pessoa"  ← Deve aparecer o nome
```

### 4. Verificar na UI
Na sidebar "Informações da Campanha", deve aparecer:

```
📅 Período
   01/01/2026 até 31/01/2026

📍 Cidade(s)
   São Paulo

👥 Criado por
   [Nome da Pessoa]  ← Deve aparecer aqui
```

## Se ainda não aparecer:

Execute este SQL para verificar se o UUID está correto:

\`\`\`sql
SELECT 
  c.id as campanha_id,
  c.nome as campanha_nome,
  c.criado_por,
  p.id as profile_id,
  p.nome as criador_nome
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
WHERE c.criado_por IS NOT NULL;
\`\`\`

Se `criador_nome` estiver NULL, significa que o UUID em `criado_por` não existe na tabela `profiles`.

## Solução se o UUID não existir:

\`\`\`sql
-- Atualizar criado_por para o primeiro admin
UPDATE campanhas 
SET criado_por = (
  SELECT id FROM profiles 
  WHERE role = 'administrador' 
  LIMIT 1
)
WHERE criado_por IS NULL OR criado_por NOT IN (SELECT id FROM profiles);
\`\`\`
