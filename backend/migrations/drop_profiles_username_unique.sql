-- profiles.username é um nome de exibição (pessoa/empresa) e pode se repetir.
-- A constraint UNIQUE foi criada fora das migrações e fazia o cadastro falhar
-- ("Database error saving new user") quando o nome já existia.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
