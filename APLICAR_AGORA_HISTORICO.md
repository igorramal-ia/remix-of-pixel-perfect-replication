# 🚀 APLICAR AGORA: Sistema de Histórico de Mudanças

## ⚡ Ação Rápida

### 1. Abrir SQL Editor no Supabase

### 2. Copiar e Colar Este SQL:

```sql
-- ============================================
-- CRIAR SISTEMA DE HISTÓRICO DE MUDANÇAS
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS historico_mudancas_endereco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id UUID REFERENCES instalacoes(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  endereco_antigo_id UUID REFERENCES enderecos(id),
  endereco_novo_id UUID REFERENCES enderecos(id),
  motivo TEXT NOT NULL,
  data_mudanca TIMESTAMPTZ DEFAULT now(),
  realizado_por UUID REFERENCES auth.users(id),
  fotos_comprovacao TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_campanha ON historico_mudancas_endereco(campanha_id);
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_data ON historico_mudancas_endereco(data_mudanca DESC);
CREATE INDEX IF NOT EXISTS idx_historico_mudancas_realizado_por ON historico_mudancas_endereco(realizado_por);

-- Comentários
COMMENT ON TABLE historico_mudancas_endereco IS 'Histórico de todas as mudanças de endereço em instalações';
COMMENT ON COLUMN historico_mudancas_endereco.motivo IS 'Motivo da substituição do endereço';

-- Habilitar RLS
ALTER TABLE historico_mudancas_endereco ENABLE ROW LEVEL SECURITY;

-- Policy: Admins e operações veem tudo
CREATE POLICY "Admins e operações veem histórico completo"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'operacoes')
  )
);

-- Policy: Coordenadores veem apenas seu território
CREATE POLICY "Coordenadores veem histórico do seu território"
ON historico_mudancas_endereco FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    JOIN enderecos e ON e.id = historico_mudancas_endereco.endereco_novo_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'coordenador'
    AND (
      p.territorios->>'cidades' LIKE '%' || e.cidade || '%'
      OR p.territorios->>'comunidades' LIKE '%' || e.comunidade || '%'
    )
  )
);

-- Policy: Inserção apenas para admins e operações
CREATE POLICY "Admins e operações podem inserir histórico"
ON historico_mudancas_endereco FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrador', 'operacoes')
  )
);
```

### 3. Executar (Run)

### 4. Verificar Resultado:

```sql
-- Deve retornar a tabela
SELECT table_name FROM information_schema.tables
WHERE table_name = 'historico_mudancas_endereco';

-- Deve retornar 11 colunas
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'historico_mudancas_endereco';

-- Deve retornar 3 índices
SELECT COUNT(*) FROM pg_indexes
WHERE tablename = 'historico_mudancas_endereco';
```

---

## ✅ Resultado Esperado

```
| table_name                    |
| ----------------------------- |
| historico_mudancas_endereco   |

Colunas: 11
Índices: 3
Policies: 3
```

---

## 🎯 O Que Isso Faz?

### Antes
- ❌ Substituições de endereço sem registro
- ❌ Sem motivo documentado
- ❌ Sem rastreabilidade

### Depois
- ✅ Todas as substituições registradas
- ✅ Motivo obrigatório
- ✅ Histórico completo com data, quem fez, endereços antigo/novo
- ✅ Página de relatório: `/relatorios/mudancas`

---

## 🧪 Testar Agora

### 1. Substituir um Endereço
1. Abrir campanha com instalação ativa
2. Clicar "Substituir"
3. Preencher motivo: "Teste do sistema"
4. Selecionar novo endereço
5. Confirmar

### 2. Ver no Histórico
1. Ir para: `/relatorios/mudancas`
2. Verificar se a substituição aparece
3. Verificar: data, campanha, endereços, motivo

### 3. Verificar no Banco
```sql
SELECT 
  data_mudanca,
  motivo,
  (SELECT nome FROM campanhas WHERE id = campanha_id) as campanha
FROM historico_mudancas_endereco
ORDER BY data_mudanca DESC
LIMIT 5;
```

---

## 📋 Status das Implementações

### ✅ Prioridade Máxima
- Cache e Geocoding

### ✅ Prioridade Alta
- Sugestão Inteligente
- Criar Novo Endereço
- Excluir Endereço (663 endereços ativos)

### ⏳ Prioridade Média
- **Histórico de Mudanças** ← APLICAR AGORA!

---

## 🎉 Após Aplicar

Todas as funcionalidades estarão completas e prontas para uso!

**Próximo passo**: Executar testes consolidados (`TESTES_CONSOLIDADOS_FINAL.md`)

