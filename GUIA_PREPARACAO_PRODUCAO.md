# Guia de Preparação para Produção

## ⚠️ ATENÇÃO: PROCESSO IRREVERSÍVEL

Este guia vai limpar TODOS os dados de teste e preparar o sistema para produção.

## Passo 1: Backup (Recomendado)

Antes de começar, faça backup do banco de dados:

```bash
# No Supabase Dashboard:
# Settings > Database > Database Backups > Create Backup
```

## Passo 2: Executar Script de Limpeza

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `limpar-dados-producao.sql`
4. **LEIA O SCRIPT INTEIRO** antes de executar
5. Clique em **Run**

### O que o script faz:
- ✅ Deleta todas as campanhas de teste
- ✅ Deleta todas as instalações de teste
- ✅ Deleta todos os relatórios de teste
- ✅ Deleta histórico de mudanças
- ✅ Deleta notificações
- ✅ Remove todos os usuários EXCETO o admin
- ✅ Limpa profiles e user_roles

### O que o script MANTÉM (dados reais):
- ✅ Todos os endereços cadastrados
- ✅ Todos os proprietários
- ✅ Usuário admin

### O que o script NÃO faz (precisa fazer manualmente):
- ❌ Deletar arquivos do Storage (fotos e relatórios)
- ❌ Deletar usuários do Authentication

## Passo 3: Limpar Storage Manualmente

### 3.1 Limpar Fotos de Instalações
1. Vá em **Storage** > **instalacoes**
2. Selecione todos os arquivos
3. Clique em **Delete**
4. Confirme

### 3.2 Limpar Relatórios
1. Vá em **Storage** > **relatorios**
2. Selecione todos os arquivos
3. Clique em **Delete**
4. Confirme

## Passo 4: Limpar Usuários do Authentication

1. Vá em **Authentication** > **Users**
2. Identifique o usuário admin (email: `admin@digitalfavela.com.br`)
3. **NÃO DELETE O ADMIN!**
4. Delete todos os outros usuários:
   - Selecione cada usuário (exceto admin)
   - Clique em **Delete user**
   - Confirme

## Passo 5: Verificar Limpeza

Execute este SQL para verificar:

```sql
-- Deve retornar 0 para campanhas/instalações/relatórios
-- Mas MANTÉM endereços e proprietários
SELECT 'Campanhas' as tabela, COUNT(*) as registros FROM campanhas
UNION ALL
SELECT 'Instalações', COUNT(*) FROM instalacoes
UNION ALL
SELECT 'Endereços (MANTIDOS)', COUNT(*) FROM enderecos
UNION ALL
SELECT 'Relatórios', COUNT(*) FROM relatorios_gerados
UNION ALL
SELECT 'Proprietários (MANTIDOS)', COUNT(*) FROM proprietarios
UNION ALL
SELECT 'Usuários', COUNT(*) FROM profiles;
```

**Resultado esperado:**
- Campanhas: 0
- Instalações: 0
- Endereços: 664 (ou quantos você tiver - MANTIDOS!)
- Relatórios: 0
- Proprietários: (quantos você tiver - MANTIDOS!)
- Usuários: 1 (apenas admin)

## Passo 6: Testar Login do Admin

1. Faça logout do sistema
2. Faça login com as credenciais do admin
3. Verifique se consegue acessar todas as páginas
4. Verifique se o Dashboard está vazio (sem campanhas)
5. Verifique se o Inventário mostra os endereços (MANTIDOS!)
6. Verifique se o Mapa mostra os endereços (MANTIDOS!)

## Passo 7: Organizar Arquivos (Não Deletar!)

### 7.1 Organizar em vez de deletar

Como vocês vão continuar desenvolvendo, **organize** os arquivos em vez de deletar:

```bash
# Execute o script de organização
bash organizar-arquivos-dev.sh
```

Isso vai criar a estrutura:
```
docs/
├── desenvolvimento/  # Docs de dev (CORRECAO_*.md, etc)
├── specs/           # Especificações
├── sql-debug/       # Scripts SQL de debug
└── producao/        # Guias de produção
```

### 7.2 Vantagens dessa abordagem

- ✅ Mantém histórico de desenvolvimento
- ✅ Útil para onboarding de novos devs
- ✅ Raiz do projeto limpa
- ✅ Fácil de encontrar documentação quando necessário
- ✅ Não perde informações importantes

## Passo 8: Commit e Push

```bash
# Adicionar todas as mudanças
git add .

# Commit
git commit -m "feat: Sistema pronto para produção - IA Consultiva implementada"

# Push
git push origin main
```

## Passo 9: Criar Novos Usuários

Agora você pode criar usuários reais para o sistema:

### Via Interface (Recomendado)
1. Faça login como admin
2. Vá em **Usuários**
3. Clique em **Criar Usuário**
4. Preencha os dados
5. Selecione o role apropriado
6. Clique em **Criar**

### Roles Disponíveis
- **Administrador**: Acesso total ao sistema
- **Operações**: Gerencia inventário, campanhas e relatórios
- **Coordenador**: Visualiza apenas suas campanhas e territórios

## Passo 10: Documentação para Novos Usuários

Crie um documento simples explicando:
1. Como fazer login
2. Como navegar no sistema
3. Como criar campanhas
4. Como usar a IA Consultiva
5. Como gerar relatórios

## Checklist Final

Antes de liberar para produção, verifique:

- [ ] Todos os dados de teste foram removidos (campanhas, instalações, relatórios)
- [ ] Endereços foram MANTIDOS (verificar no inventário)
- [ ] Proprietários foram MANTIDOS
- [ ] Storage está limpo (sem fotos/relatórios de teste)
- [ ] Apenas o usuário admin existe
- [ ] Admin consegue fazer login
- [ ] Dashboard está vazio (sem campanhas)
- [ ] Inventário mostra os endereços reais
- [ ] Mapa mostra os endereços reais
- [ ] Todas as páginas carregam sem erro
- [ ] IA Consultiva responde corretamente
- [ ] Código foi commitado e pushed
- [ ] Arquivos de debug foram organizados em docs/
- [ ] `.env` não foi commitado (apenas `.env.example`)
- [ ] README está atualizado

## Suporte

Se algo der errado:
1. Restaure o backup do banco de dados
2. Revise os logs de erro
3. Verifique as migrations aplicadas
4. Teste em ambiente local primeiro

## Próximos Passos

Após liberar para produção:
1. Monitore logs de erro
2. Colete feedback dos usuários
3. Documente bugs encontrados
4. Planeje próximas features
5. Configure backups automáticos

---

**Data de Preparação**: 01/03/2026
**Versão do Sistema**: 1.0.0
**Status**: Pronto para Produção ✅
