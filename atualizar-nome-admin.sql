-- Atualizar o nome do profile do admin
UPDATE profiles 
SET nome = 'ADM'
WHERE id = '108f4c18-d956-47e2-a41c-39d6ea378949';

-- Verificar resultado
SELECT 
  c.id,
  c.nome as campanha,
  c.criado_por,
  p.nome as criador_nome
FROM campanhas c
LEFT JOIN profiles p ON c.criado_por = p.id
ORDER BY c.criado_em DESC;
