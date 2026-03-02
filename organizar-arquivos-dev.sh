#!/bin/bash

# Script para ORGANIZAR (não deletar) arquivos de desenvolvimento

echo "📁 Organizando arquivos de desenvolvimento..."

# Criar estrutura de pastas
mkdir -p docs/desenvolvimento
mkdir -p docs/specs
mkdir -p docs/sql-debug
mkdir -p docs/producao

# Mover arquivos de documentação de desenvolvimento
echo "📄 Movendo documentação de desenvolvimento..."
mv CORRECAO_*.md docs/desenvolvimento/ 2>/dev/null
mv DEBUG_*.md docs/desenvolvimento/ 2>/dev/null
mv SOLUCAO_*.md docs/desenvolvimento/ 2>/dev/null
mv IMPLEMENTADO_*.md docs/desenvolvimento/ 2>/dev/null
mv APLICAR_*.md docs/desenvolvimento/ 2>/dev/null
mv RESUMO_*.md docs/desenvolvimento/ 2>/dev/null
mv PLANO_*.md docs/desenvolvimento/ 2>/dev/null
mv TODO_*.md docs/desenvolvimento/ 2>/dev/null
mv MELHORIAS_*.md docs/desenvolvimento/ 2>/dev/null
mv CHANGELOG_*.md docs/desenvolvimento/ 2>/dev/null
mv BUGS_*.md docs/desenvolvimento/ 2>/dev/null
mv CHECKLIST_*.md docs/desenvolvimento/ 2>/dev/null
mv TESTES_*.md docs/desenvolvimento/ 2>/dev/null
mv INSTRUCOES_*.md docs/desenvolvimento/ 2>/dev/null
mv EXPLICACAO_*.md docs/desenvolvimento/ 2>/dev/null
mv DESABILITAR_*.md docs/desenvolvimento/ 2>/dev/null
mv MUDANCA_*.md docs/desenvolvimento/ 2>/dev/null
mv RELATORIO_*.md docs/desenvolvimento/ 2>/dev/null
mv SPEC_*.md docs/desenvolvimento/ 2>/dev/null
mv MELHORIA_*.md docs/desenvolvimento/ 2>/dev/null
mv IMPLEMENTACAO_*.md docs/desenvolvimento/ 2>/dev/null

# Mover specs
echo "📋 Movendo especificações..."
cp -r .kiro/specs/* docs/specs/ 2>/dev/null

# Mover scripts SQL de debug
echo "🗄️ Movendo scripts SQL de debug..."
mv debug-*.sql docs/sql-debug/ 2>/dev/null
mv verificar-*.sql docs/sql-debug/ 2>/dev/null
mv diagnostico-*.sql docs/sql-debug/ 2>/dev/null
mv corrigir-*.sql docs/sql-debug/ 2>/dev/null
mv criar-*.sql docs/sql-debug/ 2>/dev/null
mv atualizar-*.sql docs/sql-debug/ 2>/dev/null
mv remover-*.sql docs/sql-debug/ 2>/dev/null
mv validar-*.sql docs/sql-debug/ 2>/dev/null
mv test-*.sql docs/sql-debug/ 2>/dev/null
mv forcar-*.sql docs/sql-debug/ 2>/dev/null
mv aplicar-*.sql docs/sql-debug/ 2>/dev/null

# Mover documentação de produção
echo "🚀 Movendo documentação de produção..."
mv GUIA_PREPARACAO_PRODUCAO.md docs/producao/ 2>/dev/null
mv PREPARACAO_PRODUCAO_RESUMO.md docs/producao/ 2>/dev/null
mv ESTRATEGIA_ARQUIVOS_DEV.md docs/producao/ 2>/dev/null
mv limpar-dados-producao.sql docs/producao/ 2>/dev/null

# Criar README na pasta docs
cat > docs/README.md << 'EOF'
# Documentação do Projeto

## Estrutura

- **desenvolvimento/** - Documentação do processo de desenvolvimento
- **specs/** - Especificações de features
- **sql-debug/** - Scripts SQL para debug e testes
- **producao/** - Guias de preparação para produção

## Como usar

Esta documentação é útil para:
- Entender decisões de desenvolvimento
- Onboarding de novos desenvolvedores
- Referência de implementações passadas
- Debug e troubleshooting

## Manutenção

Mantenha esta pasta organizada movendo novos arquivos de desenvolvimento para as pastas apropriadas.
EOF

echo ""
echo "✅ Organização concluída!"
echo ""
echo "Estrutura criada:"
echo "  docs/"
echo "    ├── desenvolvimento/  (documentação de dev)"
echo "    ├── specs/           (especificações)"
echo "    ├── sql-debug/       (scripts SQL)"
echo "    ├── producao/        (guias de produção)"
echo "    └── README.md"
echo ""
echo "Raiz do projeto agora contém apenas:"
echo "  - README.md"
echo "  - .env.example"
echo "  - package.json"
echo "  - src/"
echo "  - supabase/"
echo "  - docs/"
echo ""
echo "Próximo passo: git add . && git commit -m 'docs: Organizar documentação'"
