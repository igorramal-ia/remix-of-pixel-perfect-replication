# Estratégia para Arquivos de Desenvolvimento

## ❌ NÃO DELETE os arquivos de dev se vai continuar desenvolvendo!

## ✅ Estratégia Recomendada

### Opção 1: Mover para pasta /docs (Recomendado)

Crie uma pasta `docs/` e mova todos os arquivos de documentação para lá:

```bash
mkdir -p docs/desenvolvimento
mkdir -p docs/specs
mkdir -p docs/sql-debug

# Mover arquivos
mv *_*.md docs/desenvolvimento/
mv *.sql docs/sql-debug/ (exceto migrations)
mv .kiro/specs/* docs/specs/
```

**Vantagens:**
- Mantém histórico de desenvolvimento
- Organizado e fácil de encontrar
- Não polui a raiz do projeto
- Útil para onboarding de novos devs

### Opção 2: Criar .gitignore para arquivos temporários

Adicione ao `.gitignore`:

```
# Arquivos SQL temporários
debug-*.sql
verificar-*.sql
test-*.sql
temp-*.sql

# Documentação temporária
TEMP_*.md
DEBUG_*.md
```

**Vantagens:**
- Arquivos locais não vão para o repositório
- Cada dev pode ter seus próprios arquivos de debug
- Não perde arquivos importantes

### Opção 3: Branch separada para documentação

```bash
# Criar branch de docs
git checkout -b docs/desenvolvimento

# Commit apenas docs
git add *.md *.sql
git commit -m "docs: Documentação de desenvolvimento"

# Voltar para main
git checkout main
```

**Vantagens:**
- Histórico preservado em branch separada
- Main limpa para produção
- Fácil de consultar quando necessário

## 📁 Estrutura Recomendada

```
projeto/
├── docs/
│   ├── desenvolvimento/      # Docs de dev
│   │   ├── CORRECAO_*.md
│   │   ├── IMPLEMENTADO_*.md
│   │   └── RESUMO_*.md
│   ├── specs/               # Especificações
│   │   ├── ia-consultiva/
│   │   └── sistema-relatorios/
│   ├── sql-debug/           # Scripts SQL de debug
│   │   ├── debug-*.sql
│   │   └── verificar-*.sql
│   └── producao/            # Docs de produção
│       ├── GUIA_PREPARACAO_PRODUCAO.md
│       └── README_PRODUCAO.md
├── src/                     # Código fonte
├── supabase/
│   └── migrations/          # Migrations (manter!)
├── .gitignore
├── README.md
└── package.json
```

## 🎯 Recomendação Final

**Para o seu caso (desenvolvimento contínuo):**

1. **Crie a pasta `docs/`** e organize os arquivos
2. **Mantenha na raiz apenas:**
   - README.md
   - .env.example
   - package.json
   - Arquivos de configuração
3. **Atualize o .gitignore** para ignorar arquivos temporários
4. **Faça commit da estrutura organizada**

## 📝 Script Atualizado

Vou criar um script que ORGANIZA em vez de DELETAR:
