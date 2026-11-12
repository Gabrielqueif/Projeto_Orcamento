-- Empreendimento = orçamento + obra unificados.
-- `orcamentos` passa a ser o registro-mãe. Migration aditiva: não apaga dados.

ALTER TABLE orcamentos
    ADD COLUMN IF NOT EXISTS descricao TEXT,
    ADD COLUMN IF NOT EXISTS proprietario TEXT,
    ADD COLUMN IF NOT EXISTS endereco JSONB,
    ADD COLUMN IF NOT EXISTS fase TEXT NOT NULL DEFAULT 'orcamentacao_detalhada',
    ADD COLUMN IF NOT EXISTS margem_negociacao_pct NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;

ALTER TABLE orcamentos
    DROP CONSTRAINT IF EXISTS orcamentos_fase_check;
ALTER TABLE orcamentos
    ADD CONSTRAINT orcamentos_fase_check
    CHECK (fase IN ('estimativa_custos', 'orcamentacao_detalhada', 'obra'));

ALTER TABLE orcamentos
    DROP CONSTRAINT IF EXISTS orcamentos_margem_negociacao_pct_check;
ALTER TABLE orcamentos
    ADD CONSTRAINT orcamentos_margem_negociacao_pct_check
    CHECK (margem_negociacao_pct IS NULL OR (margem_negociacao_pct >= 0 AND margem_negociacao_pct < 100));

-- Orçamentos que já viraram obra ficam na fase 'obra'.
UPDATE orcamentos o
   SET fase = 'obra'
 WHERE EXISTS (SELECT 1 FROM obras b WHERE b.orcamento_id = o.id);

-- Alinha o status da obra: o código usa CONCLUIDA, o CHECK original só aceitava CONCLUIDO.
ALTER TABLE obras DROP CONSTRAINT IF EXISTS obras_status_check;
ALTER TABLE obras
    ADD CONSTRAINT obras_status_check
    CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'CONCLUIDA', 'ATRASADO'));
