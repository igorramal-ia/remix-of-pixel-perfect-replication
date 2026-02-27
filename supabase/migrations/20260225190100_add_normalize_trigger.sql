-- Migration: Adicionar trigger para normalizar automaticamente cidade e comunidade

-- Criar função que normaliza cidade e comunidade antes de inserir/atualizar
CREATE OR REPLACE FUNCTION public.normalize_endereco_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar cidade para Title Case
  IF NEW.cidade IS NOT NULL THEN
    NEW.cidade = initcap(trim(NEW.cidade));
  END IF;
  
  -- Normalizar comunidade para Title Case
  IF NEW.comunidade IS NOT NULL THEN
    NEW.comunidade = initcap(trim(NEW.comunidade));
  END IF;
  
  -- Normalizar UF para maiúsculo
  IF NEW.uf IS NOT NULL THEN
    NEW.uf = upper(trim(NEW.uf));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes de INSERT ou UPDATE
CREATE TRIGGER trigger_normalize_endereco
  BEFORE INSERT OR UPDATE ON public.enderecos
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_endereco_before_save();

-- Comentários
COMMENT ON FUNCTION public.normalize_endereco_before_save() IS 
'Normaliza automaticamente cidade (Title Case), comunidade (Title Case) e UF (maiúsculo) antes de salvar';

COMMENT ON TRIGGER trigger_normalize_endereco ON public.enderecos IS 
'Trigger que normaliza capitalização de cidade, comunidade e UF automaticamente';
