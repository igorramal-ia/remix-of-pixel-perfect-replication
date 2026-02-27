-- Corrigir role duplicada do Arlindo

-- 1. Ver as roles duplicadas
SELECT user_id, role
FROM user_roles
WHERE user_id = '70a91430-d20a-4fbd-82f3-057c1d51d8bf';

-- 2. Deletar a role "representante" (manter apenas "coordenador")
DELETE FROM user_roles
WHERE user_id = '70a91430-d20a-4fbd-82f3-057c1d51d8bf'
  AND role = 'representante';

-- 3. Verificar que ficou apenas "coordenador"
SELECT user_id, role
FROM user_roles
WHERE user_id = '70a91430-d20a-4fbd-82f3-057c1d51d8bf';

-- 4. Verificar se há outros usuários com roles duplicadas
SELECT user_id, COUNT(*) as total_roles
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;
