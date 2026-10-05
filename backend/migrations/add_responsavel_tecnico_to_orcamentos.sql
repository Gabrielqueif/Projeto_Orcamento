-- Migração: responsável técnico, nº do conselho e margem em R$ nos orçamentos
ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS responsavel_tecnico TEXT,
ADD COLUMN IF NOT EXISTS numero_conselho VARCHAR(50),
ADD COLUMN IF NOT EXISTS margem_valor NUMERIC(15, 2) DEFAULT 0.00;
