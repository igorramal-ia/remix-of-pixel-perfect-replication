-- Migration: Adicionar grupos de instalação e sistema de notificações

-- 1. Atualizar tabela campanha_coordenadores para suportar endereços específicos
ALTER TABLE public.campanha_coordenadores
ADD COLUMN endereco_ids UUID[] DEFAULT ARRAY[]::UUID[];

COMMENT ON COLUMN public.campanha_coordenadores.endereco_ids IS 
'Array de IDs de endereços vinculados especificamente a este coordenador nesta campanha';

-- 2. Criar tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índices para performance
  CONSTRAINT notificacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX idx_notificacoes_criado_em ON public.notificacoes(criado_em DESC);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para notificações
CREATE POLICY "Users can view own notifications" ON public.notificacoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notificacoes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Operacoes can create notifications" ON public.notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'operacoes'));

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION public.marcar_notificacao_lida(notificacao_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notificacoes
  SET lida = TRUE
  WHERE id = notificacao_id AND user_id = auth.uid();
END;
$$;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION public.marcar_todas_notificacoes_lidas()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notificacoes
  SET lida = TRUE
  WHERE user_id = auth.uid() AND lida = FALSE;
END;
$$;

-- Função para contar notificações não lidas
CREATE OR REPLACE FUNCTION public.contar_notificacoes_nao_lidas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM public.notificacoes
  WHERE user_id = auth.uid() AND lida = FALSE;
  
  RETURN count;
END;
$$;

-- Comentários
COMMENT ON TABLE public.notificacoes IS 
'Notificações do sistema para usuários';

COMMENT ON FUNCTION public.marcar_notificacao_lida IS 
'Marca uma notificação específica como lida';

COMMENT ON FUNCTION public.marcar_todas_notificacoes_lidas IS 
'Marca todas as notificações do usuário como lidas';

COMMENT ON FUNCTION public.contar_notificacoes_nao_lidas IS 
'Retorna o número de notificações não lidas do usuário';
