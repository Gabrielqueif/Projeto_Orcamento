-- Autoria do diário (quem criou/enviou/aprovou e quando) e notificações de evento persistidas.
-- As notificações de risco do painel continuam derivadas; esta tabela guarda só eventos
-- pontuais (ex.: "Diário enviado"), com leitura própria (lida_em).

ALTER TABLE public.diarios_obra
    ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enviado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.notificacoes_evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('DIARIO_ENVIADO')),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    href TEXT NOT NULL,
    lida_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_evento_user ON public.notificacoes_evento(user_id, created_at DESC);

ALTER TABLE public.notificacoes_evento ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.notificacoes_evento TO postgres, service_role;
REVOKE ALL ON TABLE public.notificacoes_evento FROM anon;
GRANT SELECT, UPDATE ON TABLE public.notificacoes_evento TO authenticated;

-- Destinatário só lê e marca como lida as suas; a criação é feita pelo backend (service role).
DROP POLICY IF EXISTS "notificacoes_evento_destinatario_le" ON public.notificacoes_evento;
CREATE POLICY "notificacoes_evento_destinatario_le" ON public.notificacoes_evento
    FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notificacoes_evento_destinatario_marca" ON public.notificacoes_evento;
CREATE POLICY "notificacoes_evento_destinatario_marca" ON public.notificacoes_evento
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
