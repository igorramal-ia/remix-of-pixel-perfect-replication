-- Corrigir função contar_notificacoes_nao_lidas
-- A função estava sem parâmetro user_id, causando erro 404

DROP FUNCTION IF EXISTS contar_notificacoes_nao_lidas();

CREATE OR REPLACE FUNCTION contar_notificacoes_nao_lidas(p_user_id UUID) 
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM notificacoes 
  WHERE notificacoes.user_id = p_user_id AND lida = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION contar_notificacoes_nao_lidas(UUID) IS 
  'Conta o número de notificações não lidas de um usuário específico';
