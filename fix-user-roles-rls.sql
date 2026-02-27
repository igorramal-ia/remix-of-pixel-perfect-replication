-- Corrigir RLS da tabela user_roles
-- O erro mostra que INSERT está bloqueado

-- Desabilitar RLS temporariamente para debug
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- OU criar policies corretas:

-- Remover policies antigas
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view user_roles" ON public.user_roles;

-- Policy para INSERT (Admins podem criar roles)
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'administrador')
);

-- Policy para SELECT (todos podem ver roles)
CREATE POLICY "Users can view user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- Policy para UPDATE (Admins podem atualizar)
CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
);

-- Policy para DELETE (Admins podem deletar)
CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';
