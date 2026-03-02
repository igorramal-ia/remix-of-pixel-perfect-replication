#!/bin/bash

# Script para limpar arquivos de desenvolvimento antes do commit

echo "🧹 Limpando arquivos de desenvolvimento..."

# Arquivos SQL de debug
rm -f debug-*.sql
rm -f verificar-*.sql
rm -f diagnostico-*.sql
rm -f corrigir-*.sql
rm -f criar-*.sql
rm -f atualizar-*.sql
rm -f remover-*.sql
rm -f validar-*.sql
rm -f test-*.sql
rm -f forcar-*.sql
rm -f aplicar-*.sql

# Arquivos de documentação de desenvolvimento
rm -f CORRECAO_*.md
rm -f DEBUG_*.md
rm -f SOLUCAO_*.md
rm -f IMPLEMENTADO_*.md
rm -f APLICAR_*.md
rm -f RESUMO_*.md
rm -f SPEC_*.md
rm -f PLANO_*.md
rm -f TODO_*.md
rm -f MELHORIAS_*.md
rm -f CHANGELOG_*.md
rm -f BUGS_*.md
rm -f CHECKLIST_*.md
rm -f TESTES_*.md
rm -f INSTRUCOES_*.md
rm -f EXPLICACAO_*.md
rm -f DESABILITAR_*.md
rm -f MUDANCA_*.md
rm -f RELATORIO_*.md

# Manter apenas guias essenciais
# GUIA_PREPARACAO_PRODUCAO.md será mantido

echo "✅ Limpeza concluída!"
echo ""
echo "Arquivos mantidos:"
echo "  - README.md"
echo "  - .env.example"
echo "  - GUIA_PREPARACAO_PRODUCAO.md"
echo "  - limpar-dados-producao.sql"
echo "  - Todo o código fonte (src/)"
echo "  - Migrations (supabase/migrations/)"
echo ""
echo "Próximo passo: git add . && git commit -m 'feat: Sistema pronto para produção'"
