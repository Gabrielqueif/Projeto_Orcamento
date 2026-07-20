-- Migração para criar as tabelas de Obras, Baselines de Orçamento e Limites de Requisição

-- 1. Tabela de Obras (Projetos Executivos Ativos)
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
    cliente VARCHAR(255) NOT NULL,
    endereco JSONB,
    escopo TEXT,
    data_inicio_real DATE NOT NULL,
    prazo_estimado_dias INTEGER NOT NULL,
    engenheiro_responsavel_id UUID REFERENCES public.membros_equipe(id) ON DELETE SET NULL,
    enviar_curva_abc_almoxarifado BOOLEAN DEFAULT TRUE,
    bloquear_planilha_base BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e permissões para public.obras
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.obras TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.obras TO anon, authenticated;

CREATE POLICY "Permitir tudo para usuários autenticados em obras" 
ON public.obras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Tabela de Auditoria - Baselines (Orçamento Meta)
CREATE TABLE IF NOT EXISTS public.orcamentos_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL,
    bdi NUMERIC(5, 2) NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e permissões para public.orcamentos_meta
ALTER TABLE public.orcamentos_meta ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.orcamentos_meta TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orcamentos_meta TO anon, authenticated;

CREATE POLICY "Permitir tudo para usuários autenticados em orcamentos_meta" 
ON public.orcamentos_meta FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela de Limites de Requisição (Almoxarifado / Suprimentos)
CREATE TABLE IF NOT EXISTS public.limites_requisicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    codigo_insumo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    unidade VARCHAR(20) NOT NULL,
    quantidade_limite NUMERIC(12, 4) NOT NULL,
    quantidade_requisitada NUMERIC(12, 4) DEFAULT 0.0000 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_obra_insumo UNIQUE (obra_id, codigo_insumo)
);

-- Habilitar RLS e permissões para public.limites_requisicao
ALTER TABLE public.limites_requisicao ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.limites_requisicao TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.limites_requisicao TO anon, authenticated;

CREATE POLICY "Permitir tudo para usuários autenticados em limites_requisicao" 
ON public.limites_requisicao FOR ALL TO authenticated USING (true) WITH CHECK (true);
