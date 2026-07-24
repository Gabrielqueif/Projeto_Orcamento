-- Criar a tabela de despesas/custos reais
CREATE TABLE IF NOT EXISTS public.custos_despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Materiais', 'Mão de Obra', 'Equipamentos', 'Administrativo', 'Outros')),
    status VARCHAR(50) NOT NULL DEFAULT 'EM_ANALISE' CHECK (status IN ('EM_ANALISE', 'APROVADO', 'PAGO', 'RECUSADO')),
    data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
    responsavel VARCHAR(100) NOT NULL,
    documento_url TEXT, -- URL para nota fiscal / recibo
    origem VARCHAR(50) NOT NULL DEFAULT 'MANUAL' CHECK (origem IN ('MANUAL', 'ALMOXARIFADO', 'COMPRAS')),
    insumo_id UUID REFERENCES public.estoque_insumos(id) ON DELETE SET NULL,
    locacao_id UUID REFERENCES public.locacoes_equipamentos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de busca rápida
CREATE INDEX IF NOT EXISTS idx_custos_despesas_obra ON public.custos_despesas(obra_id);
CREATE INDEX IF NOT EXISTS idx_custos_despesas_categoria ON public.custos_despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_custos_despesas_competencia ON public.custos_despesas(data_competencia);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.custos_despesas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir leitura para usuários autenticados"
    ON public.custos_despesas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
    ON public.custos_despesas FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
    ON public.custos_despesas FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Permitir deleção para usuários autenticados"
    ON public.custos_despesas FOR DELETE
    TO authenticated
    USING (true);
