-- Migration: Corrigir RLS policies da tabela notificacoes
-- Problema: Policies duplicadas causando erro ao criar campanhas

-- Remover policies existentes
DROP POLICY IF EXISTS "Admins can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Operacoes can insert notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can view own notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users can update own notificacoes" ON public.notificacoes;

-- Criar policy unificada para INSERT (Admins e Operações)
CREATE POLICY "Admins and operacoes can insert notificacoes"
ON public.notificacoes FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador') OR 
  public.has_role(auth.uid(), 'operacoes')
);

-- Policy para SELECT (usuários veem suas próprias notificações)
CREATE POLICY "Users can view own notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy para UPDATE (usuários atualizam suas próprias notificações)
CREATE POLICY "Users can update own notificacoes"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir que RLS está habilitado
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE public.notificacoes IS 
  'Tabela de notificações com RLS: Admins/Operações podem criar, usuários veem/atualizam apenas as suas';
