-- Script para corrigir RLS policies da tabela notificacoes
-- Remove policies existentes e recria corretamente

-- 1. Remover policies existentes (se existirem)
DROP POLICY IF EXISTS "Admins can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Operacoes can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

-- 2. Criar policy para INSERT (Admins e Operações podem criar notificações)
CREATE POLICY "Admins and operacoes can insert notificacoes"
ON public.notificacoes FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') OR 
  public.has_role(auth.uid(), 'operacoes')
);

-- 3. Criar policy para SELECT (Usuários podem ver suas próprias notificações)
CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Criar policy para UPDATE (Usuários podem atualizar suas próprias notificações)
CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Verificar se RLS está habilitado
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- 6. Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notificacoes'
ORDER BY policyname;
