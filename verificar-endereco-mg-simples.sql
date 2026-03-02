-- Buscar endereço em MG que está ocupado
SELECT 
  e.id,
  e.endereco,
  e.cidade,
  e.uf,
  e.lat,
  e.long
FROM enderecos e
WHERE e.uf = 'MG' 
  AND e.ativo = true
  AND EXISTS (
    SELECT 1 FROM instalacoes i 
    WHERE i.endereco_id = e.id 
    AND i.status IN ('ativa', 'pendente')
  );
