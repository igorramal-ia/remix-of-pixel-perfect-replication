
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('representante', 'admin', 'gestor', 'cliente');

-- Enum for address status
CREATE TYPE public.endereco_status AS ENUM ('disponivel', 'ocupado', 'inativo', 'manutencao');

-- Enum for installation status
CREATE TYPE public.instalacao_status AS ENUM ('ativa', 'finalizada', 'cancelada', 'pendente');

-- Profiles table (usuarios)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'representante',
  UNIQUE (user_id, role)
);

-- Security definer function for role checks
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

-- Trigger to auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'representante');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enderecos table
CREATE TABLE public.enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uf TEXT NOT NULL,
  cidade TEXT NOT NULL,
  comunidade TEXT NOT NULL,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION,
  long DOUBLE PRECISION,
  status endereco_status NOT NULL DEFAULT 'disponivel',
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proprietarios table
CREATE TABLE public.proprietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  endereco_id UUID REFERENCES public.enderecos(id) ON DELETE SET NULL,
  audio_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campanhas table
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  cidade TEXT,
  gestor_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instalacoes table
CREATE TABLE public.instalacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endereco_id UUID NOT NULL REFERENCES public.enderecos(id),
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id),
  representante_id UUID REFERENCES auth.users(id),
  foto_url TEXT,
  data_instalacao DATE,
  data_expiracao DATE,
  status instalacao_status NOT NULL DEFAULT 'pendente',
  finalizado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventario historico table
CREATE TABLE public.inventario_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endereco_id UUID NOT NULL REFERENCES public.enderecos(id),
  status_anterior endereco_status,
  status_novo endereco_status NOT NULL,
  alterado_por UUID REFERENCES auth.users(id),
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_historico ENABLE ROW LEVEL SECURITY;

-- RLS: Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- RLS: User roles (only admins can manage, everyone can read own)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Enderecos (all authenticated can read, admins/gestors can write)
CREATE POLICY "Authenticated can view enderecos" ON public.enderecos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage enderecos" ON public.enderecos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestors can manage enderecos" ON public.enderecos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Representantes can insert enderecos" ON public.enderecos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'representante') AND criado_por = auth.uid());

-- RLS: Proprietarios
CREATE POLICY "Authenticated can view proprietarios" ON public.proprietarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage proprietarios" ON public.proprietarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestors can manage proprietarios" ON public.proprietarios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- RLS: Campanhas
CREATE POLICY "Authenticated can view campanhas" ON public.campanhas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage campanhas" ON public.campanhas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestors can manage own campanhas" ON public.campanhas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor') AND gestor_id = auth.uid());

-- RLS: Instalacoes
CREATE POLICY "Authenticated can view instalacoes" ON public.instalacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage instalacoes" ON public.instalacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Representantes can manage own instalacoes" ON public.instalacoes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'representante') AND representante_id = auth.uid());

-- RLS: Inventario historico
CREATE POLICY "Authenticated can view historico" ON public.inventario_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert historico" ON public.inventario_historico FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestors can insert historico" ON public.inventario_historico FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));
