-- Notificações lidas: guarda, por usuário, quais riscos do painel já foram marcados como lidos.
-- chave: "{tipo}:{obra_id}" (ex.: "ATRASO:4f1c..."), a mesma usada pela API de notificações.
-- Uma linha some quando o risco deixa de existir (a API apaga as chaves obsoletas ao listar).

CREATE TABLE IF NOT EXISTS public.notificacoes_lidas (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    lida_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, chave)
);

ALTER TABLE public.notificacoes_lidas ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.notificacoes_lidas TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notificacoes_lidas TO authenticated;
REVOKE ALL ON TABLE public.notificacoes_lidas FROM anon;

DROP POLICY IF EXISTS "Ler notificacoes lidas próprias" ON public.notificacoes_lidas;
CREATE POLICY "Ler notificacoes lidas próprias" ON public.notificacoes_lidas
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Inserir notificacoes lidas próprias" ON public.notificacoes_lidas;
CREATE POLICY "Inserir notificacoes lidas próprias" ON public.notificacoes_lidas
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Atualizar notificacoes lidas próprias" ON public.notificacoes_lidas;
CREATE POLICY "Atualizar notificacoes lidas próprias" ON public.notificacoes_lidas
    FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Remover notificacoes lidas próprias" ON public.notificacoes_lidas;
CREATE POLICY "Remover notificacoes lidas próprias" ON public.notificacoes_lidas
    FOR DELETE USING ((select auth.uid()) = user_id);
