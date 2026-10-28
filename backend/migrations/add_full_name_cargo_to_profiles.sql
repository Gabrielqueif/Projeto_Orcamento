-- Adiciona nome completo e cargo ao perfil do usuário (tela de Configurações).
--
-- `cargo` aqui é o cargo profissional exibido no menu (ex.: "Engenheiro civil").
-- NÃO confundir com `role`, que é o papel de permissão (user/admin) e continua
-- protegido: esta migration não altera RLS, grants nem a coluna `role`.
--
-- Idempotente: pode ser executada mais de uma vez sem efeito colateral.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(120);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo VARCHAR(80);
