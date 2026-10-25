-- Cargos da equipe: pré-montados (user_id NULL, somente leitura) e criados pelo usuário.
-- campos_ocultos: campos-base do membro que o cargo dispensa (cpf, data_inicio, descricao, remuneracao).
-- campos_extras: [{"chave","rotulo","tipo": texto|numero|data,"obrigatorio"}] pedidos só para esse cargo.

CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    campos_ocultos TEXT[] NOT NULL DEFAULT '{}',
    campos_extras JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (campos_ocultos <@ ARRAY['cpf', 'data_inicio', 'descricao', 'remuneracao'])
);

CREATE UNIQUE INDEX IF NOT EXISTS cargos_nome_usuario_idx ON public.cargos (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(nome));

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.cargos TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cargos TO authenticated;

CREATE POLICY "Ler cargos pré-montados e próprios" ON public.cargos FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Inserir cargos próprios" ON public.cargos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Atualizar cargos próprios" ON public.cargos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Remover cargos próprios" ON public.cargos FOR DELETE USING (auth.uid() = user_id);

-- Campos ocultáveis deixam de ser obrigatórios no membro.
ALTER TABLE public.membros_equipe
    ALTER COLUMN cpf DROP NOT NULL,
    ALTER COLUMN data_inicio DROP NOT NULL,
    ALTER COLUMN remuneracao DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dados_extras JSONB NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO public.cargos (user_id, nome, campos_ocultos, campos_extras) VALUES
    (NULL, 'Engenheiro Civil', '{}', '[{"chave":"crea","rotulo":"Registro CREA","tipo":"texto","obrigatorio":true}]'),
    (NULL, 'Mestre de Obras', '{}', '[]'),
    (NULL, 'Eletricista', '{}', '[{"chave":"nr10_validade","rotulo":"Validade NR-10","tipo":"data","obrigatorio":true}]'),
    (NULL, 'Pedreiro', '{descricao}', '[]'),
    (NULL, 'Servente', '{descricao}', '[]'),
    (NULL, 'Auxiliar Administrativo', '{descricao}', '[]')
ON CONFLICT DO NOTHING;
