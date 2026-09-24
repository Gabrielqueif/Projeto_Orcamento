-- Migração: Suporte a BDI Analítico (TCU Acórdão 2622/2013) e BDI Diferenciado

-- 1. Campos de BDI na tabela de orçamentos
ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS tipo_bdi VARCHAR(20) DEFAULT 'ANALITICO' CHECK (tipo_bdi IN ('ANALITICO', 'SINTETICO')),
ADD COLUMN IF NOT EXISTS bdi_config JSONB DEFAULT '{
  "regime_tributario": "LUCRO_PRESUMIDO_REAL",
  "ac": 4.00,
  "sg": 0.80,
  "r": 1.20,
  "df": 1.23,
  "lucro": 7.40,
  "pis": 0.65,
  "cofins": 3.00,
  "iss": 5.00,
  "cprb": 0.00,
  "aliquota_simples": 0.00,
  "bdi_diferenciado": 15.00
}'::jsonb;

-- 2. Campos de BDI na tabela de itens de orçamento
ALTER TABLE public.orcamento_itens
ADD COLUMN IF NOT EXISTS tipo_bdi_item VARCHAR(20) DEFAULT 'PADRAO' CHECK (tipo_bdi_item IN ('PADRAO', 'DIFERENCIADO')),
ADD COLUMN IF NOT EXISTS bdi_aplicado NUMERIC(5, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS preco_unitario_bdi NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS preco_total_bdi NUMERIC(15, 2) DEFAULT 0.00;
