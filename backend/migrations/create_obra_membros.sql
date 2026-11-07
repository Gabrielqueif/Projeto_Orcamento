-- Acesso de mestre de obras/supervisor a uma obra (canteiro).
-- obra_membros: vínculo usuário ↔ obra com papel. obra_convites: convite de uso único;
-- só o hash SHA-256 do token é guardado (o token em claro existe apenas no link entregue ao dono).
-- O backend usa a service role e faz o controle de acesso em core/ownership.py; as políticas
-- abaixo só protegem o acesso direto via PostgREST.

CREATE TABLE IF NOT EXISTS public.obra_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    papel TEXT NOT NULL CHECK (papel IN ('MESTRE', 'SUPERVISOR')),
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (obra_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.obra_convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    papel TEXT NOT NULL CHECK (papel IN ('MESTRE', 'SUPERVISOR')),
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado_em TIMESTAMP WITH TIME ZONE,
    usado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_obra_membros_user ON public.obra_membros(user_id);
CREATE INDEX IF NOT EXISTS idx_obra_convites_obra ON public.obra_convites(obra_id);

ALTER TABLE public.obra_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_convites ENABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON TABLE public.obra_membros, public.obra_convites TO postgres, service_role;
REVOKE ALL ON TABLE public.obra_membros, public.obra_convites FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.obra_membros TO authenticated;
-- Convites: só o dono acessa (o membro nunca lê o hash). Aceitar convite passa pelo backend.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.obra_convites TO authenticated;

DROP POLICY IF EXISTS "obra_membros_dono_ou_proprio" ON public.obra_membros;
CREATE POLICY "obra_membros_dono_ou_proprio" ON public.obra_membros
    FOR SELECT TO authenticated
    USING (
        user_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "obra_membros_dono_gerencia" ON public.obra_membros;
CREATE POLICY "obra_membros_dono_gerencia" ON public.obra_membros
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));

DROP POLICY IF EXISTS "obra_convites_dono" ON public.obra_convites;
CREATE POLICY "obra_convites_dono" ON public.obra_convites
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.obras o WHERE o.id = obra_id AND o.user_id = (select auth.uid())));
