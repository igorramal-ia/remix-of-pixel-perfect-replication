# 🚀 Guia Rápido: Aplicar Sistema de Relatórios

## ⚠️ ERRO ATUAL

Você está vendo este erro porque o bucket `relatorios` ainda não existe no Supabase Storage.

```
Erro ao fazer upload: StorageApiError: Bucket not found
```

## ✅ SOLUÇÃO (5 minutos)

### Passo 1: Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto

### Passo 2: Abrir SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique no botão **New Query** (ou pressione Ctrl+N)

### Passo 3: Executar o Script

1. Abra o arquivo `aplicar-sistema-relatorios-completo.sql` (está na raiz do projeto)
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique no botão **Run** (ou pressione Ctrl+Enter)

### Passo 4: Verificar Sucesso

Você deve ver 4 mensagens de sucesso no final:

```
✅ Tabela relatorios_gerados criada com sucesso!
✅ Bucket relatorios criado com sucesso!
✅ Policies da tabela configuradas!
✅ Policies do storage configuradas!
```

### Passo 5: Testar o Sistema

1. Volte para a aplicação (recarregue a página se necessário)
2. Acesse uma campanha que tenha instalações ativas
3. Clique em **"Gerar Relatório"**
4. Preencha:
   - Tipo: Parcial ou Final
   - Número PI: Ex: 521548 (ou qualquer número)
5. Clique em **"Gerar Relatório"**
6. Aguarde alguns segundos
7. O arquivo PowerPoint será baixado automaticamente! 🎉

## 📋 O que o script faz?

1. **Cria a tabela `relatorios_gerados`**
   - Armazena histórico de todos os relatórios gerados
   - Campos: campanha, tipo, número PI, URL do arquivo, tamanho, etc.

2. **Cria o bucket `relatorios` no Storage**
   - Armazena os arquivos PowerPoint gerados
   - Estrutura: `{campanha_id}/{nome_arquivo}.pptx`

3. **Configura permissões (RLS)**
   - Admins e operações: acesso total
   - Coordenadores: veem apenas relatórios das suas campanhas
   - Todos podem gerar relatórios

4. **Cria índices para performance**
   - Busca rápida por campanha, tipo, data

## 🎯 Funcionalidades Disponíveis

Após aplicar o script, você terá:

### 1. Geração de Relatórios
- ✅ Botão "Gerar Relatório" na página de campanhas
- ✅ Modal para escolher tipo (Parcial/Final) e número PI
- ✅ Geração automática do PowerPoint
- ✅ Download automático do arquivo

### 2. Estrutura do PowerPoint
- ✅ Slide de capa com informações da campanha
- ✅ Slide de resumo executivo com estatísticas
- ✅ Slides organizados por Estado → Cidade → Comunidade
- ✅ **1 slide por endereço** com fotos e datas
- ✅ Slide de encerramento

### 3. Histórico de Relatórios
- ✅ Página "Relatórios" no menu
- ✅ Lista de todos os relatórios gerados
- ✅ Filtros por campanha, tipo, data
- ✅ Download de relatórios anteriores
- ✅ Deleção (apenas admins/operações)

## 🐛 Problemas Comuns

### Erro: "Bucket not found"
**Causa**: O script ainda não foi executado
**Solução**: Execute o script `aplicar-sistema-relatorios-completo.sql`

### Erro: "relation relatorios_gerados does not exist"
**Causa**: A tabela não foi criada
**Solução**: Execute o script completo novamente

### Erro: "Número PI é obrigatório"
**Causa**: Campo vazio
**Solução**: Preencha o número PI antes de gerar

### Erro: "Nenhuma instalação ativa encontrada"
**Causa**: A campanha não tem instalações no status correto
**Solução**: 
- Para relatório Parcial: precisa ter instalações ATIVAS
- Para relatório Final: precisa ter instalações ATIVAS ou FINALIZADAS

### Relatório não baixa automaticamente
**Causa**: Bloqueador de pop-ups do navegador
**Solução**: Permita downloads automáticos para o site

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12) para ver erros detalhados
2. Verifique se o script foi executado com sucesso no Supabase
3. Verifique se o bucket `relatorios` existe em Storage → Buckets
4. Verifique se a tabela `relatorios_gerados` existe em Database → Tables

## 🎉 Pronto!

Após executar o script, o sistema de relatórios estará 100% funcional e pronto para uso em produção!
