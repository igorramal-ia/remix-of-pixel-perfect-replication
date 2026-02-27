-- Corrigir policies para permitir criação de usuários via signUp

-- 1. Verificar policies atuais da tabela user_roles
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
WHERE tablename = 'user_roles';

-- 2. Permitir que usuários recém-criados possam inserir sua própria role
-- (necessário para o fluxo de signUp)

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;

-- Criar policy para permitir INSERT durante signup
CREATE POLICY "Users can insert own role on signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  -- Permitir se for admin OU se for o próprio usuário (durante signup)
  public.has_role(auth.uid(), 'administrador') 
  OR user_id = auth.uid()
);

-- 3. Verificar policies da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Permitir que usuários atualizem seu próprio profile (telefone, territorios)

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Criar policy para permitir UPDATE do próprio profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 5. Verificar se as policies foram criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_roles', 'profiles')
ORDER BY tablename, cmd;

-- 6. Testar criação de role (executar após criar usuário via signUp)
-- Substitua [user_id] pelo ID do usuário recém-criado
/*
INSERT INTO user_roles (user_id, role)
VALUES ('[user_id]', 'coordenador');

-- Verificar
SELECT * FROM user_roles WHERE user_id = '[user_id]';
*/

-- 7. Testar atualização de profile
/*
UPDATE profiles 
SET telefone = '(11) 98765-4321',
    territorios = '{"cidades": ["São Paulo"], "comunidades": ["Heliópolis"]}'::jsonb
WHERE id = '[user_id]';

-- Verificar
SELECT id, nome, telefone, territorios FROM profiles WHERE id = '[user_id]';
*/
