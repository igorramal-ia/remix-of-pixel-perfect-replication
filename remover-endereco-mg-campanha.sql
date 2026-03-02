-- Remover endereço de MG da campanha "Mario sergio"
-- Este endereço foi adicionado por engano em uma campanha de SP

DELETE FROM instalacoes
WHERE id = 'd43ed38a-eef4-4afe-b499-912b62a4eb48';

-- Verificar se foi removido
SELECT COUNT(*) as instalacoes_restantes
FROM instalacoes
WHERE campanha_id = '281d8f8a-c556-4be4-99e1-c2afaff43a55';
