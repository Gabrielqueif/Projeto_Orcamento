-- Migração para criar a tabela de equipes (equipes) e relacionar com membros_equipe

CREATE TABLE IF NOT EXISTS public.equipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;

-- Permissões de acesso
GRANT ALL PRIVILEGES ON TABLE public.equipes TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipes TO anon, authenticated;

-- Políticas de segurança RLS
CREATE POLICY "Permitir leitura das próprias equipes" 
ON public.equipes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção vinculando ao próprio usuário" 
ON public.equipes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir atualização apenas das próprias equipes" 
ON public.equipes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir remoção apenas das próprias equipes" 
ON public.equipes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Adicionar coluna equipe_id na tabela membros_equipe
ALTER TABLE public.membros_equipe 
ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL;
