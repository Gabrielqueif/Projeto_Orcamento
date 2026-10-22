-- Diário de obra: um registro por obra e por dia, com fotos no Supabase Storage.
-- RLS por dono da obra (obras.user_id), como nas demais tabelas de acompanhamento.
-- O backend usa a service role e faz o isolamento em core/ownership.py + repositórios.

CREATE TABLE IF NOT EXISTS public.diarios_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    atividades TEXT NOT NULL,
    ocorrencias TEXT,
    clima VARCHAR(20) NOT NULL CHECK (clima IN ('SOL', 'NUBLADO', 'CHUVA')),
    temperatura NUMERIC(4, 1),
    equipe_presente INTEGER NOT NULL DEFAULT 0 CHECK (equipe_presente >= 0),
    responsavel VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'ENVIADO', 'APROVADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_diario_obra_data UNIQUE (obra_id, data)
);

CREATE INDEX IF NOT EXISTS idx_diarios_obra_obra_data ON public.diarios_obra(obra_id, data DESC);

CREATE TABLE IF NOT EXISTS public.diario_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diario_id UUID NOT NULL REFERENCES public.diarios_obra(id) ON DELETE CASCADE,
    caminho TEXT NOT NULL,
    legenda VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_diario_fotos_diario ON public.diario_fotos(diario_id);

ALTER TABLE public.diarios_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_fotos ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.diarios_obra, public.diario_fotos TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.diarios_obra, public.diario_fotos TO authenticated;
REVOKE ALL ON TABLE public.diarios_obra, public.diario_fotos FROM anon;

CREATE POLICY "diarios_obra_dono_da_obra" ON public.diarios_obra
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

CREATE POLICY "diario_fotos_dono_da_obra" ON public.diario_fotos
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.diarios_obra d JOIN public.obras o ON o.id = d.obra_id
        WHERE d.id = diario_id AND o.user_id = (select auth.uid())
    ));

-- Bucket privado: sem política em storage.objects, só o backend (service role) lê e grava;
-- o frontend recebe URLs assinadas de curta duração.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('diario-fotos', 'diario-fotos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
