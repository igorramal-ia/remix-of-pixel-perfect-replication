-- Buscar endereços ocupados em Minas Gerais
SELECT 
  e.id,
  e.uf,
  e.cidade,
  e.comunidade,
  e.endereco,
  e.lat,
  e.long,
  e.ativo
FROM enderecos e
WHERE e.uf = 'MG' 
  AND e.ativo = true
  AND EXISTS (
    SELECT 1 FROM instalacoes i 
    WHERE i.endereco_id = e.id 
    AND i.status IN ('ativa', 'pendente')
  );

-- Verificar instalações desse endereço
SELECT 
  i.id as instalacao_id,
  i.endereco_id,
  i.campanha_id,
  i.status,
  i.data_instalacao,
  i.data_retirada_prevista,
  i.data_retirada_real,
  c.nome as campanha_nome,
  c.uf as campanha_uf
FROM instalacoes i
JOIN campanhas c ON c.id = i.campanha_id
WHERE i.endereco_id IN (
  SELECT e.id FROM enderecos e
  WHERE e.uf = 'MG' 
    AND e.ativo = true
    AND EXISTS (
      SELECT 1 FROM instalacoes i2 
      WHERE i2.endereco_id = e.id 
      AND i2.status IN ('ativa', 'pendente')
    )
)
AND i.status IN ('ativa', 'pendente');

-- Verificar detalhes completos dos endereços ocupados em MG
SELECT 
  e.id as endereco_id,
  e.uf as endereco_uf,
  e.cidade as endereco_cidade,
  e.comunidade,
  e.endereco,
  e.lat,
  e.long,
  c.id as campanha_id,
  c.nome as campanha_nome,
  i.id as instalacao_id,
  i.status as instalacao_status,
  i.data_instalacao,
  i.data_retirada_prevista
FROM enderecos e
JOIN instalacoes i ON i.endereco_id = e.id
JOIN campanhas c ON c.id = i.campanha_id
WHERE e.uf = 'MG'
  AND i.status IN ('ativa', 'pendente')
  AND e.ativo = true;
