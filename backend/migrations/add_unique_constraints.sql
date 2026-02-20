-- Adiciona constraints únicas para evitar duplicatas no re-upload do mesmo mês.
-- Permite que o upsert do Supabase atualize registros existentes ao invés de duplicar.

-- Composição: uma entrada única por código + mês
ALTER TABLE composicao
ADD CONSTRAINT uq_composicao_codigo_mes
UNIQUE (codigo_composicao, mes_referencia);

-- Composição estados: uma entrada única por código + mês + tipo
ALTER TABLE composicao_estados
ADD CONSTRAINT uq_composicao_estados_codigo_mes_tipo
UNIQUE (codigo_composicao, mes_referencia, tipo_composicao);
