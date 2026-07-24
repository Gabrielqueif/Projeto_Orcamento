-- Migração: Criação das tabelas de Inventário, Almoxarifado e Locações
-- Data: 2026-07-23

CREATE TABLE IF NOT EXISTS estoque_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    codigo_insumo VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    localizacao VARCHAR(150) NOT NULL,
    quantidade_atual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantidade_minima NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unidade VARCHAR(30) NOT NULL,
    preco_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estoque_insumos_obra ON estoque_insumos(obra_id);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insumo_id UUID NOT NULL REFERENCES estoque_insumos(id) ON DELETE CASCADE,
    tipo_movimentacao VARCHAR(30) NOT NULL, -- 'ENTRADA' ou 'SAIDA'
    quantidade NUMERIC(12, 2) NOT NULL,
    responsavel VARCHAR(150) NOT NULL,
    observacoes TEXT,
    data_movimentacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS locacoes_equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    nome_equipamento VARCHAR(255) NOT NULL,
    locadora VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'EM_USO', 'AGUARDANDO_RETIRADA', 'FINALIZADO'
    devolucao_prevista DATE NOT NULL,
    responsavel VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locacoes_obra ON locacoes_equipamentos(obra_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE locacoes_equipamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para usuários autenticados
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'estoque_insumos' AND policyname = 'Permitir leitura de estoque para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura de estoque para usuários autenticados" 
        ON estoque_insumos FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'estoque_insumos' AND policyname = 'Permitir modificação de estoque para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir modificação de estoque para usuários autenticados" 
        ON estoque_insumos FOR ALL TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'movimentacoes_estoque' AND policyname = 'Permitir leitura de movimentações para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura de movimentações para usuários autenticados" 
        ON movimentacoes_estoque FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'movimentacoes_estoque' AND policyname = 'Permitir modificação de movimentações para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir modificação de movimentações para usuários autenticados" 
        ON movimentacoes_estoque FOR ALL TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locacoes_equipamentos' AND policyname = 'Permitir leitura de locações para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura de locações para usuários autenticados" 
        ON locacoes_equipamentos FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'locacoes_equipamentos' AND policyname = 'Permitir modificação de locações para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir modificação de locações para usuários autenticados" 
        ON locacoes_equipamentos FOR ALL TO authenticated USING (true);
    END IF;
END $$;
