-- Restringe o RLS das tabelas de acompanhamento de obra ao dono da obra.
--
-- As políticas antigas usavam USING (true): qualquer usuário autenticado lia e
-- alterava obras, estoque, locações e despesas de todos via PostgREST com a chave
-- pública (anon). O backend usa a service role e não é afetado; o isolamento
-- dele é feito em core/ownership.py e nos repositórios.
--
-- Tabelas filhas herdam o dono pela obra (obra_id → obras.user_id);
-- movimentações herdam pelo insumo; orcamentos_meta pelo orçamento.

-- 1. Remove todas as políticas atuais dessas tabelas. Feito dinamicamente porque
--    alguns nomes antigos foram truncados em 63 caracteres pelo Postgres.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'obras', 'estoque_insumos', 'movimentacoes_estoque', 'locacoes_equipamentos',
              'custos_despesas', 'limites_requisicao', 'orcamentos_meta'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. anon não precisa de acesso direto a nenhuma delas.
REVOKE ALL ON TABLE
    public.obras, public.estoque_insumos, public.movimentacoes_estoque, public.locacoes_equipamentos,
    public.custos_despesas, public.limites_requisicao, public.orcamentos_meta
FROM anon;

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locacoes_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limites_requisicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_meta ENABLE ROW LEVEL SECURITY;

-- 3. Políticas por dono. (select auth.uid()) é avaliado uma vez por consulta, não por linha.
CREATE POLICY "obras_dono" ON public.obras
    FOR ALL TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "estoque_insumos_dono_da_obra" ON public.estoque_insumos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

CREATE POLICY "locacoes_equipamentos_dono_da_obra" ON public.locacoes_equipamentos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

CREATE POLICY "custos_despesas_dono_da_obra" ON public.custos_despesas
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

CREATE POLICY "limites_requisicao_dono_da_obra" ON public.limites_requisicao
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

CREATE POLICY "movimentacoes_estoque_dono_da_obra" ON public.movimentacoes_estoque
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.estoque_insumos e JOIN public.obras o ON o.id = e.obra_id
        WHERE e.id = insumo_id AND o.user_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.estoque_insumos e JOIN public.obras o ON o.id = e.obra_id
        WHERE e.id = insumo_id AND o.user_id = (select auth.uid())
    ));

CREATE POLICY "orcamentos_meta_dono_do_orcamento" ON public.orcamentos_meta
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.orcamentos orc WHERE orc.id = orcamento_id AND orc.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos orc WHERE orc.id = orcamento_id AND orc.user_id = (select auth.uid())));

-- Índices usados pelas subconsultas das políticas.
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_insumo ON public.movimentacoes_estoque(insumo_id);
CREATE INDEX IF NOT EXISTS idx_limites_requisicao_obra ON public.limites_requisicao(obra_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_meta_orcamento ON public.orcamentos_meta(orcamento_id);
