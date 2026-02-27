-- Verificar todos os coordenadores e seus territórios

SELECT 
  p.id,
  p.nome,
  p.email,
  p.territorios,
  ur.role,
  p.criado_em,
  -- Extrair arrays de cidades e comunidades
  p.territorios->'cidades' as cidades_array,
  p.territorios->'comunidades' as comunidades_array,
  -- Contar quantos tem
  jsonb_array_length(COALESCE(p.territorios->'cidades', '[]'::jsonb)) as num_cidades,
  jsonb_array_length(COALESCE(p.territorios->'comunidades', '[]'::jsonb)) as num_comunidades
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'coordenador'
ORDER BY p.criado_em DESC;

-- Ver especificamente o Arlindo
SELECT 
  nome,
  email,
  territorios,
  territorios->'comunidades' as comunidades,
  jsonb_array_length(territorios->'comunidades') as total_comunidades
FROM profiles 
WHERE nome = 'Arlindo';
