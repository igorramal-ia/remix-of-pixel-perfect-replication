-- Criar usuário de teste
-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard
-- ou use o comando: supabase db push

-- Inserir usuário na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teste@exemplo.com',
  crypt('senha123', gen_salt('bf')), -- senha: senha123
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Usuário Teste"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- O trigger handle_new_user() vai criar automaticamente:
-- 1. Um registro em public.profiles
-- 2. Um registro em public.user_roles com role 'representante'

-- Para criar um usuário admin, execute após a inserção acima:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'teste@exemplo.com';
