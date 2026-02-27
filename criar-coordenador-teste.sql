-- Script para criar usuário coordenador de teste
-- Execute no SQL Editor do Supabase

-- 1. Criar usuário de teste (use signUp no frontend ou crie manualmente)
-- Email: coordenador.teste@example.com
-- Senha: Teste@123

-- 2. Buscar o ID do usuário criado (substitua o email se necessário)
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'coordenador.teste@example.com';

  -- Se não encontrou, mostrar erro
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado. Crie o usuário primeiro via interface de cadastro.';
  END IF;

  -- 3. Criar profile
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (
    user_id_var,
    'Coordenador Teste',
    '(11) 99999-9999'
  )
  ON CONFLICT (id) DO UPDATE
  SET nome = 'Coordenador Teste',
      telefone = '(11) 99999-9999';

  -- 4. Adicionar role de coordenador
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_var, 'coordenador')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 5. Adicionar territórios (Brasilândia e Cantinho do Céu)
  UPDATE public.profiles
  SET territorios = jsonb_build_object(
    'ufs', jsonb_build_array('SP'),
    'cidades', jsonb_build_array('São Paulo'),
    'comunidades', jsonb_build_array('Brasilândia', 'Cantinho Do Céu')
  )
  WHERE id = user_id_var;

  RAISE NOTICE 'Coordenador de teste criado com sucesso!';
  RAISE NOTICE 'Email: coordenador.teste@example.com';
  RAISE NOTICE 'Senha: Teste@123';
  RAISE NOTICE 'ID: %', user_id_var;
END $$;

-- 6. Verificar se foi criado corretamente
SELECT 
  p.id,
  p.nome,
  p.telefone,
  p.territorios,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.nome = 'Coordenador Teste';
