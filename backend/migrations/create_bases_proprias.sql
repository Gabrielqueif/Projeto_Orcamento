-- Bases de dados próprias por usuário (Fase 3).
-- A base própria é mais uma "fonte" ao lado de SINAPI e SEINFRA, mas pertence a um usuário.
-- RLS por dono em todas as tabelas: bases_proprias pelo user_id; as filhas herdam o dono
-- pela base (join com bases_proprias). O backend usa a service role e faz o isolamento em
-- core/ownership.py + repositórios; as políticas protegem o acesso direto via PostgREST.
-- Sem nenhum acesso do role anon.

CREATE TABLE IF NOT EXISTS public.bases_proprias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    uf CHAR(2),
    data_referencia DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bases_proprias_user ON public.bases_proprias(user_id);

CREATE TABLE IF NOT EXISTS public.base_propria_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID NOT NULL REFERENCES public.bases_proprias(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO')),
    preco NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (preco >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_base_propria_insumo_codigo UNIQUE (base_id, codigo)
);

CREATE TABLE IF NOT EXISTS public.base_propria_composicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_id UUID NOT NULL REFERENCES public.bases_proprias(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    grupo VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_base_propria_composicao_codigo UNIQUE (base_id, codigo)
);

CREATE TABLE IF NOT EXISTS public.base_propria_composicao_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    composicao_id UUID NOT NULL REFERENCES public.base_propria_composicoes(id) ON DELETE CASCADE,
    ref_fonte VARCHAR(10) NOT NULL CHECK (ref_fonte IN ('PROPRIA', 'SINAPI', 'SEINFRA')),
    ref_tipo VARCHAR(10) NOT NULL CHECK (ref_tipo IN ('INSUMO', 'COMPOSICAO')),
    ref_codigo VARCHAR(50) NOT NULL,
    coeficiente NUMERIC(15, 6) NOT NULL CHECK (coeficiente > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices nas FKs (a UNIQUE (base_id, codigo) já cobre base_id nas duas tabelas de catálogo).
CREATE INDEX IF NOT EXISTS idx_base_propria_composicao_itens_composicao
    ON public.base_propria_composicao_itens(composicao_id);
CREATE INDEX IF NOT EXISTS idx_base_propria_composicao_itens_ref
    ON public.base_propria_composicao_itens(ref_fonte, ref_tipo, ref_codigo);

ALTER TABLE public.bases_proprias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_propria_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_propria_composicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_propria_composicao_itens ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE
    public.bases_proprias, public.base_propria_insumos,
    public.base_propria_composicoes, public.base_propria_composicao_itens
TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.bases_proprias, public.base_propria_insumos,
    public.base_propria_composicoes, public.base_propria_composicao_itens
TO authenticated;
REVOKE ALL ON TABLE
    public.bases_proprias, public.base_propria_insumos,
    public.base_propria_composicoes, public.base_propria_composicao_itens
FROM anon;

CREATE POLICY "bases_proprias_dono" ON public.bases_proprias
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "base_propria_insumos_dono_da_base" ON public.base_propria_insumos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.bases_proprias b WHERE b.id = base_id AND b.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.bases_proprias b WHERE b.id = base_id AND b.user_id = (select auth.uid())));

CREATE POLICY "base_propria_composicoes_dono_da_base" ON public.base_propria_composicoes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.bases_proprias b WHERE b.id = base_id AND b.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.bases_proprias b WHERE b.id = base_id AND b.user_id = (select auth.uid())));

CREATE POLICY "base_propria_composicao_itens_dono_da_base" ON public.base_propria_composicao_itens
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.base_propria_composicoes c JOIN public.bases_proprias b ON b.id = c.base_id
        WHERE c.id = composicao_id AND b.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.base_propria_composicoes c JOIN public.bases_proprias b ON b.id = c.base_id
        WHERE c.id = composicao_id AND b.user_id = (select auth.uid())
    ));
