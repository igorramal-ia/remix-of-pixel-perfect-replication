-- Corrigir policies de notificações para permitir criação por admins e operações

-- 1. Ver policies atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'notificacoes'
ORDER BY cmd;

-- 2. Remover policies antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Admins and operacoes can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Admins can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Operacoes can insert notificacoes" ON public.notificacoes;

-- 3. Criar policy única para INSERT (admins E operações)
CREATE POLICY "Admins and operacoes can insert notificacoes"
ON public.notificacoes FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') 
  OR public.has_role(auth.uid(), 'operacoes')
);

-- 4. Permitir que usuários vejam suas próprias notificações
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;

CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 5. Permitir que usuários marquem suas notificações como lidas
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Verificar policies criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'notificacoes'
ORDER BY cmd;

-- 7. Testar criação de notificação (substitua [user_id])
/*
INSERT INTO notificacoes (user_id, titulo, mensagem)
VALUES ('[user_id]', 'Teste', 'Mensagem de teste');

-- Verificar
SELECT * FROM notificacoes WHERE user_id = '[user_id]' ORDER BY criado_em DESC LIMIT 1;
*/
