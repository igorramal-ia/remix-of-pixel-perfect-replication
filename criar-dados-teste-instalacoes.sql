-- Script para criar dados de teste para o sistema de instalações

-- 1. Criar uma instalação PENDENTE (para testar botão "Ativar")
-- Substitua os UUIDs pelos IDs reais da sua campanha e endereço
/*
INSERT INTO instalacoes (campanha_id, endereco_id, status)
VALUES (
  'UUID_DA_CAMPANHA',
  'UUID_DO_ENDERECO',
  'pendente'
);
*/

-- 2. Criar uma instalação ATIVA (para testar botão "Finalizar")
-- Com data de retirada em 5 dias (vai aparecer aviso laranja)
/*
INSERT INTO instalacoes (
  campanha_id, 
  endereco_id, 
  status,
  data_instalacao,
  data_retirada_prevista,
  fotos_instalacao
)
VALUES (
  'UUID_DA_CAMPANHA',
  'UUID_DO_ENDERECO',
  'ativa',
  CURRENT_DATE - 25,
  CURRENT_DATE + 5,
  ARRAY['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg', 'https://exemplo.com/foto3.jpg']
);
*/

-- 3. Criar uma instalação ATIVA ATRASADA (vai aparecer badge vermelho)
/*
INSERT INTO instalacoes (
  campanha_id, 
  endereco_id, 
  status,
  data_instalacao,
  data_retirada_prevista,
  fotos_instalacao
)
VALUES (
  'UUID_DA_CAMPANHA',
  'UUID_DO_ENDERECO',
  'ativa',
  CURRENT_DATE - 35,
  CURRENT_DATE - 3,
  ARRAY['https://exemplo.com/foto1.jpg', 'https://exemplo.com/foto2.jpg', 'https://exemplo.com/foto3.jpg']
);
*/

-- 4. Ver suas campanhas para pegar os IDs
SELECT id, nome, cliente FROM campanhas ORDER BY criado_em DESC LIMIT 5;

-- 5. Ver endereços disponíveis para pegar os IDs
SELECT id, endereco, cidade, comunidade, status 
FROM enderecos 
WHERE status = 'disponivel'
LIMIT 10;

-- 6. Ver instalações existentes
SELECT 
  i.id,
  c.nome as campanha,
  e.endereco,
  i.status,
  i.data_instalacao,
  i.data_retirada_prevista,
  CASE 
    WHEN i.data_retirada_prevista IS NOT NULL 
    THEN (i.data_retirada_prevista - CURRENT_DATE)::INTEGER
    ELSE NULL
  END as dias_restantes
FROM instalacoes i
JOIN campanhas c ON c.id = i.campanha_id
JOIN enderecos e ON e.id = i.endereco_id
ORDER BY i.criado_em DESC;

-- 7. Atualizar uma instalação existente para PENDENTE (para testar)
-- Descomente e substitua o UUID
/*
UPDATE instalacoes 
SET status = 'pendente'
WHERE id = 'UUID_DA_INSTALACAO';
*/

-- 8. Atualizar uma instalação existente para ATIVA com aviso (para testar)
-- Descomente e substitua o UUID
/*
UPDATE instalacoes 
SET 
  status = 'ativa',
  data_instalacao = CURRENT_DATE - 25,
  data_retirada_prevista = CURRENT_DATE + 5,
  fotos_instalacao = ARRAY['https://via.placeholder.com/400', 'https://via.placeholder.com/400', 'https://via.placeholder.com/400']
WHERE id = 'UUID_DA_INSTALACAO';
*/
