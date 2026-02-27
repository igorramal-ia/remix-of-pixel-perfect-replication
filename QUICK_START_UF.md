# Quick Start: Aplicar Mudança de UF

## 🚀 Passos Rápidos

### 1. Backup (30 segundos)
```sql
CREATE TABLE profiles_backup_20260226 AS 
SELECT * FROM profiles WHERE territorios IS NOT NULL;
```

### 2. Aplicar Migration (1 minuto)
```bash
cd supabase
supabase db push
```

### 3. Verificar (30 segundos)
```sql
-- Deve retornar 1 linha
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'coordenador_cobre_uf';

-- Ver coordenadores migrados
SELECT nome, territorios->'ufs' as ufs
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador';
```

### 4. Testar no Frontend (2 minutos)
1. Ir em "Gerenciar Usuários"
2. Criar novo coordenador
3. Adicionar UF "SP"
4. Salvar
5. Verificar se aparece na lista

### 5. Testar Campanha (2 minutos)
1. Ir em "Campanhas"
2. Criar nova campanha
3. Selecionar UF "SP"
4. Verificar se mostra apenas coordenadores de SP
5. Criar campanha

## ✅ Pronto!

Se tudo funcionou, a mudança está completa.

## 📚 Documentação Completa

- `IMPLEMENTACAO_COMPLETA_UF.md` - Tudo que foi feito
- `APLICAR_MIGRATION_UF.md` - Instruções detalhadas
- `MUDANCA_COORDENADOR_POR_ESTADO.md` - Contexto completo

## ⚠️ Se Algo Der Errado

```sql
-- Restaurar do backup
UPDATE profiles p
SET territorios = b.territorios
FROM profiles_backup_20260226 b
WHERE p.id = b.id;
```

## 🆘 Ajuda

Se precisar de ajuda, veja os arquivos de documentação ou entre em contato.
