-- Serviços (itens do orçamento) executados em cada diário de obra, com a quantidade feita no dia.
-- O % do serviço é quantidade / orcamento_itens.quantidade; o avanço das etapas (medicoes_etapa)
-- é derivado destas linhas pelo backend.
-- RLS por dono da obra; o backend usa a service role e isola em core/ownership.py + repositórios.

CREATE TABLE IF NOT EXISTS public.diario_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diario_id UUID NOT NULL REFERENCES public.diarios_obra(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.orcamento_itens(id) ON DELETE CASCADE,
    quantidade NUMERIC NOT NULL CHECK (quantidade > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_diario_servico UNIQUE (diario_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_diario_servicos_item ON public.diario_servicos(item_id);

ALTER TABLE public.diario_servicos ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.diario_servicos TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.diario_servicos TO authenticated;
REVOKE ALL ON TABLE public.diario_servicos FROM anon;

CREATE POLICY "diario_servicos_dono_da_obra" ON public.diario_servicos
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ));
