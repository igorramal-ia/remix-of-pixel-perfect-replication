-- Script para criar usuário de teste no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/ompimrxcmajdxwpahbub/sql

-- Credenciais do usuário de teste:
-- Email: teste@exemplo.com
-- Senha: senha123

-- Criar usuário usando a função do Supabase Auth
SELECT auth.uid() as current_user_id;

-- Alternativa: Use o Supabase Dashboard para criar o usuário
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add user" > "Create new user"
-- 3. Email: teste@exemplo.com
-- 4. Senha: senha123
-- 5. Marque "Auto Confirm User"

-- Após criar o usuário no Dashboard, execute este script para adicionar role de admin:
-- UPDATE public.user_roles 
-- SET role = 'admin'
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'teste@exemplo.com');

-- Ou adicionar uma role adicional (um usuário pode ter múltiplas roles):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role 
-- FROM auth.users 
-- WHERE email = 'teste@exemplo.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
