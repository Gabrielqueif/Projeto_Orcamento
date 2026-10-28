-- Efetivo por função no diário de obra: quantas pessoas de cada cargo estavam no canteiro no dia.
-- cargo_id é opcional (função digitada livremente não tem cargo) e vira NULL se o cargo for excluído;
-- funcao guarda o nome no momento do registro, para o histórico não mudar com renomeações.
-- equipe_presente do diário é gravado pelo backend como a soma das quantidades.
-- RLS por dono da obra; o backend usa a service role e isola em core/ownership.py + repositórios.

CREATE TABLE IF NOT EXISTS public.diario_efetivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diario_id UUID NOT NULL REFERENCES public.diarios_obra(id) ON DELETE CASCADE,
    cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL,
    funcao VARCHAR(100) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_diario_efetivo_funcao UNIQUE (diario_id, funcao)
);

CREATE INDEX IF NOT EXISTS idx_diario_efetivo_diario ON public.diario_efetivo(diario_id);

ALTER TABLE public.diario_efetivo ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.diario_efetivo TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.diario_efetivo TO authenticated;
REVOKE ALL ON TABLE public.diario_efetivo FROM anon;

DROP POLICY IF EXISTS "diario_efetivo_dono_da_obra" ON public.diario_efetivo;
CREATE POLICY "diario_efetivo_dono_da_obra" ON public.diario_efetivo
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ));
