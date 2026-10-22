-- Fase 5: item de orçamento pode vir de uma base própria do usuário (fonte = 'PROPRIA').
-- Depende de create_bases_proprias.sql. Nullable: itens SINAPI/SEINFRA não usam a coluna.
-- Se a base for excluída, o item mantém o preço congelado e apenas perde o vínculo.

ALTER TABLE public.orcamento_itens
    ADD COLUMN IF NOT EXISTS base_propria_id UUID REFERENCES public.bases_proprias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_base_propria
    ON public.orcamento_itens(base_propria_id) WHERE base_propria_id IS NOT NULL;
