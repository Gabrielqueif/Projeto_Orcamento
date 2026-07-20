-- Migração para adicionar suporte a variáveis globais e locais na tabela de orçamentos

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS variaveis_globais JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS locais JSONB DEFAULT '[]'::jsonb;
