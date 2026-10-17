-- base_referencia guarda todos os meses/tabelas escolhidos, separados por vírgula
-- (ex.: "03/2025,T028.1-84.44%"), então varchar(15) estoura com mais de uma tabela.
ALTER TABLE public.orcamentos ALTER COLUMN base_referencia TYPE text;
