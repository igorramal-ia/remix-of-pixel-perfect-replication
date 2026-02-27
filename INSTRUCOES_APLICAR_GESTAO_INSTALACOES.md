# 🚀 Instruções para Aplicar Sistema de Gestão de Instalações

## ⚠️ IMPORTANTE: Execute na ordem correta!

### Passo 1: Aplicar SQL no Supabase

1. Abra o **Supabase Dashboard** no navegador
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie TODO o conteúdo do arquivo `aplicar-gestao-instalacoes-completa.sql`
5. Cole no editor SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a execução (deve levar alguns segundos)
8. Verifique se apareceu "Script executado com sucesso!" nos resultados

### Passo 2: Verificar se funcionou

Execute o arquivo `verificar-instalacoes-setup.sql` no SQL Editor:

1. Abra uma nova query no SQL Editor
2. Copie o conteúdo de `verificar-instalacoes-setup.sql`
3. Cole e execute
4. Verifique os resultados:
   - ✅ Deve mostrar 8 colunas novas em `instalacoes`
   - ✅ Deve mostrar a tabela `historico_instalacoes`
   - ✅ Deve mostrar 4 funções criadas
   - ✅ Deve mostrar a view `view_instalacoes_completa`
   - ✅ Deve mostrar o bucket `instalacoes-fotos`

### Passo 3: Testar no sistema

Após aplicar o SQL, o sistema deve funcionar:

1. Acesse uma campanha no sistema
2. Adicione endereços à campanha (se ainda não tiver)
3. Teste os botões:
   - **Ativar**: Para endereços pendentes
   - **Finalizar**: Para endereços ativos
   - **Substituir**: Para trocar endereços

## 🔍 O que foi implementado?

### Fluxo Completo de Instalações

```
PENDENTE → ATIVAR → ATIVA → FINALIZAR → FINALIZADA
              ↓
         SUBSTITUIR → Nova instalação PENDENTE
```

### Funcionalidades

1. **Ativar Instalação** (Pendente → Ativa)
   - Preencher data de instalação
   - Preencher data de retirada prevista
   - Upload de 3 fotos (1 comprovante + 2 placa)
   - Sistema calcula avisos e atrasos automaticamente

2. **Finalizar Instalação** (Ativa → Finalizada)
   - Preencher data de retirada real
   - Upload de mínimo 2 fotos da retirada
   - Observações opcionais
   - Endereço volta para "disponível" no inventário

3. **Substituir Endereço**
   - Marcar motivo da substituição
   - Selecionar novo endereço do inventário (mesma UF)
   - Endereço antigo liberado
   - Nova instalação criada como "pendente"

4. **Avisos Automáticos**
   - Badge laranja: 7 dias antes da retirada
   - Badge vermelho: Após data de retirada (atrasado)

5. **Histórico Automático**
   - Todas as mudanças de status são registradas
   - Quem alterou, quando, e o que mudou

6. **Storage de Fotos**
   - Bucket dedicado: `instalacoes-fotos`
   - Limite: 5MB por foto
   - Formatos: JPEG, PNG, HEIC, WebP
   - RLS habilitado para segurança

## 🐛 Problemas Conhecidos e Soluções

### Erro: "column 'data_retirada_prevista' does not exist"
**Solução**: Execute o script `aplicar-gestao-instalacoes-completa.sql` no SQL Editor

### Erro: "relation 'grupos_campanha' does not exist"
**Solução**: Esse erro foi corrigido. O código não usa mais `grupos_campanha`

### Erro: "function 'buscar_instalacoes_aviso_retirada' does not exist"
**Solução**: Execute o script `aplicar-gestao-instalacoes-completa.sql` no SQL Editor

### Erro 400 ao carregar página
**Solução**: Após aplicar o SQL, recarregue a página (Ctrl+F5)

## 📝 Próximos Passos (Futuro)

- [ ] Notificações automáticas para avisos de retirada
- [ ] Trocar coordenador de uma instalação
- [ ] Dashboard de instalações atrasadas
- [ ] Relatórios de instalações por período
- [ ] Acesso mobile para coordenadores

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Verifique se o SQL foi executado sem erros
2. Execute o script de verificação
3. Recarregue a página do sistema (Ctrl+F5)
4. Verifique o console do navegador (F12) para erros
5. Me avise qual erro está aparecendo
