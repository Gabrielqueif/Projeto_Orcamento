-- Isolamento por usuário: orçamentos e obras passam a ter dono (user_id).
-- Itens, etapas, almoxarifado e financeiro herdam o acesso via orcamento_id / obra_id
-- (verificado no backend em core/ownership.py).

ALTER TABLE public.orcamentos
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.obras
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_obras_user_id ON public.obras(user_id);

-- BACKFILL (obrigatório antes de subir o backend novo): registros com user_id NULL
-- ficam inacessíveis. Substitua <UUID_DO_DONO> pelo id do usuário em auth.users
-- que deve receber os registros existentes.
-- UPDATE public.orcamentos SET user_id = '<UUID_DO_DONO>' WHERE user_id IS NULL;
-- UPDATE public.obras o SET user_id = COALESCE(
--     (SELECT orc.user_id FROM public.orcamentos orc WHERE orc.id = o.orcamento_id),
--     '<UUID_DO_DONO>') WHERE o.user_id IS NULL;
