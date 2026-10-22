-- Histórico de medições do avanço físico por etapa.
-- orcamento_etapas.progresso guarda só o valor atual; aqui fica cada medição (etapa, data, %),
-- base da Curva S (planejado x realizado). A medição mais recente de cada etapa é espelhada
-- em orcamento_etapas.progresso pelo backend.
-- RLS por dono da obra; o backend usa a service role e isola em core/ownership.py + repositórios.

CREATE TABLE IF NOT EXISTS public.medicoes_etapa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    etapa_id UUID NOT NULL REFERENCES public.orcamento_etapas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    progresso INTEGER NOT NULL CHECK (progresso BETWEEN 0 AND 100),
    origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (origem IN ('MANUAL', 'DIARIO')),
    diario_id UUID REFERENCES public.diarios_obra(id) ON DELETE SET NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_medicao_etapa_data UNIQUE (etapa_id, data)
);

CREATE INDEX IF NOT EXISTS idx_medicoes_etapa_obra_data ON public.medicoes_etapa(obra_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_medicoes_etapa_diario ON public.medicoes_etapa(diario_id);

ALTER TABLE public.medicoes_etapa ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.medicoes_etapa TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.medicoes_etapa TO authenticated;
REVOKE ALL ON TABLE public.medicoes_etapa FROM anon;

CREATE POLICY "medicoes_etapa_dono_da_obra" ON public.medicoes_etapa
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));
