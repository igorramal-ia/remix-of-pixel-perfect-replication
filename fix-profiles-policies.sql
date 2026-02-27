-- Corrigir policies da tabela profiles para permitir edição por admins

-- 1. Verificar policies atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 2. Remover policies antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Criar policy para admins poderem atualizar qualquer profile
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
)
WITH CHECK (
  public.has_role(auth.uid(), 'administrador')
);

-- 4. Criar policy para admins poderem deletar qualquer profile
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
);

-- 5. Verificar se as policies foram criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- 6. Testar UPDATE (substitua [user_id] pelo ID do usuário)
/*
UPDATE profiles 
SET territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
WHERE id = '[user_id]';

-- Verificar
SELECT id, nome, territorios FROM profiles WHERE id = '[user_id]';
*/
