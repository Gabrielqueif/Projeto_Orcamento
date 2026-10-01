-- Corrige escalonamento de privilégio via profiles.role.
--
-- Problema: handle_new_user copiava raw_user_meta_data->>'role' (controlado pelo
-- cliente no signUp) para profiles.role, e a role `authenticated` tinha UPDATE
-- irrestrito em profiles. Qualquer usuário podia virar admin.

-- 1. Trigger de novo usuário: role nunca vem do cliente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, account_type, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    CASE WHEN new.raw_user_meta_data->>'account_type' IN ('individual', 'company')
         THEN new.raw_user_meta_data->>'account_type' ELSE 'individual' END,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Usuários não escrevem a coluna role (nem na criação, nem na edição).
REVOKE INSERT (role), UPDATE (role) ON public.profiles FROM anon, authenticated;

-- 3. RLS: cada usuário lê e edita apenas o próprio perfil.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. AUDITORIA MANUAL (obrigatória): quem é admin hoje? Rebaixe quem não deveria ser.
-- SELECT id, email, role FROM public.profiles WHERE role = 'admin';
-- UPDATE public.profiles SET role = 'user' WHERE id = '<UUID>';
