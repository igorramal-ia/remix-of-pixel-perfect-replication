-- Migration: Atualizar sistema de perfis
-- Remove perfis antigos e cria novos: administrador, operacoes, coordenador

-- 1. Remover políticas RLS que dependem do enum antigo
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage enderecos" ON public.enderecos;
DROP POLICY IF EXISTS "Gestors can manage enderecos" ON public.enderecos;
DROP POLICY IF EXISTS "Representantes can insert enderecos" ON public.enderecos;
DROP POLICY IF EXISTS "Admins can manage proprietarios" ON public.proprietarios;
DROP POLICY IF EXISTS "Gestors can manage proprietarios" ON public.proprietarios;
DROP POLICY IF EXISTS "Admins can manage campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Gestors can manage own campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Admins can manage instalacoes" ON public.instalacoes;
DROP POLICY IF EXISTS "Representantes can manage own instalacoes" ON public.instalacoes;
DROP POLICY IF EXISTS "Admins can insert historico" ON public.inventario_historico;
DROP POLICY IF EXISTS "Gestors can insert historico" ON public.inventario_historico;

-- 2. Remover a função has_role que depende do enum
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role app_role);

-- 3. Atualizar valores existentes para os novos perfis
-- representante -> coordenador
-- admin -> administrador
-- gestor -> operacoes
-- cliente -> operacoes (ou remover se não houver)
UPDATE public.user_roles SET role = 'coordenador' WHERE role = 'representante';
UPDATE public.user_roles SET role = 'administrador' WHERE role = 'admin';
UPDATE public.user_roles SET role = 'operacoes' WHERE role = 'gestor';
UPDATE public.user_roles SET role = 'operacoes' WHERE role = 'cliente';

-- 4. Alterar o tipo da coluna para text temporariamente
ALTER TABLE public.user_roles ALTER COLUMN role TYPE TEXT;

-- 5. Remover o enum antigo
DROP TYPE IF EXISTS public.app_role;

-- 6. Criar novo enum com os perfis atualizados
CREATE TYPE public.app_role AS ENUM ('administrador', 'operacoes', 'coordenador');

-- 7. Converter a coluna de volta para o novo enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;

-- 8. Atualizar o default para coordenador
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'coordenador';

-- 9. Recriar a função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 10. Atualizar o trigger para criar perfil coordenador por padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  
  -- Não criar role automaticamente - apenas administrador pode criar usuários
  -- A role será definida pelo administrador ao criar o usuário
  
  RETURN NEW;
END;
$$;

-- 11. Adicionar tabela para vincular coordenadores a campanhas
CREATE TABLE IF NOT EXISTS public.campanha_coordenadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  coordenador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, coordenador_id)
);

ALTER TABLE public.campanha_coordenadores ENABLE ROW LEVEL SECURITY;

-- 12. Recriar políticas RLS com os novos perfis

-- RLS: User roles
CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can manage roles" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

-- RLS: Enderecos
CREATE POLICY "Admins can manage enderecos" ON public.enderecos 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can manage enderecos" ON public.enderecos 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'operacoes'));

CREATE POLICY "Coordenadores can insert enderecos" ON public.enderecos 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'coordenador') AND criado_por = auth.uid());

-- RLS: Proprietarios
CREATE POLICY "Admins can manage proprietarios" ON public.proprietarios 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can manage proprietarios" ON public.proprietarios 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'operacoes'));

-- RLS: Campanhas
CREATE POLICY "Admins can manage campanhas" ON public.campanhas 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can manage campanhas" ON public.campanhas 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'operacoes'));

CREATE POLICY "Coordenadores can view assigned campanhas" ON public.campanhas 
  FOR SELECT TO authenticated 
  USING (
    public.has_role(auth.uid(), 'coordenador') AND 
    EXISTS (
      SELECT 1 FROM public.campanha_coordenadores 
      WHERE campanha_id = campanhas.id AND coordenador_id = auth.uid()
    )
  );

-- RLS: Instalacoes
CREATE POLICY "Admins can manage instalacoes" ON public.instalacoes 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can manage instalacoes" ON public.instalacoes 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'operacoes'));

CREATE POLICY "Coordenadores can manage instalacoes in assigned campanhas" ON public.instalacoes 
  FOR ALL TO authenticated 
  USING (
    public.has_role(auth.uid(), 'coordenador') AND 
    EXISTS (
      SELECT 1 FROM public.campanha_coordenadores 
      WHERE campanha_id = instalacoes.campanha_id AND coordenador_id = auth.uid()
    )
  );

-- RLS: Inventario historico
CREATE POLICY "Admins can insert historico" ON public.inventario_historico 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can insert historico" ON public.inventario_historico 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'operacoes'));

-- RLS: Campanha coordenadores
CREATE POLICY "Admins can manage campanha_coordenadores" ON public.campanha_coordenadores 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can manage campanha_coordenadores" ON public.campanha_coordenadores 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'operacoes'));

CREATE POLICY "Coordenadores can view own assignments" ON public.campanha_coordenadores 
  FOR SELECT TO authenticated 
  USING (coordenador_id = auth.uid());
