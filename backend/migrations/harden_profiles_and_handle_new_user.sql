-- handle_new_user() é função de gatilho (auth.users): não deve ser chamável via /rest/v1/rpc.
-- O gatilho on_auth_user_created continua funcionando: EXECUTE só é checado na criação do gatilho.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Cada usuário lê só o próprio perfil (profiles_select_own continua valendo).
-- O backend consulta profiles.role com a service role e não depende desta política.
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON public.profiles;

REVOKE ALL ON TABLE public.profiles FROM anon;
