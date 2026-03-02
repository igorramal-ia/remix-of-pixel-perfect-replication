-- Verificar qual campanha está usando esse endereço de MG
SELECT 
  i.id as instalacao_id,
  i.status,
  i.data_instalacao,
  c.id as campanha_id,
  c.nome as campanha_nome,
  c.data_inicio,
  c.data_fim
FROM instalacoes i
JOIN campanhas c ON c.id = i.campanha_id
WHERE i.endereco_id = '80bfb2a8-5953-47e0-b507-8c0fb87c412a'
  AND i.status IN ('ativa', 'pendente');
