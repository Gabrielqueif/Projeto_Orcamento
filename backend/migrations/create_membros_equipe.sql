-- Migração para criar a tabela de membros de equipe (membros_equipe)

CREATE TABLE IF NOT EXISTS public.membros_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    descricao TEXT,
    orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
    remuneracao NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.membros_equipe ENABLE ROW LEVEL SECURITY;

-- Permissões de acesso
GRANT ALL PRIVILEGES ON TABLE public.membros_equipe TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.membros_equipe TO anon, authenticated;

-- Políticas de segurança RLS (para quando o client do frontend interagir direto se necessário)
CREATE POLICY "Permitir leitura apenas dos próprios membros" 
ON public.membros_equipe 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção vinculando ao próprio usuário" 
ON public.membros_equipe 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir atualização apenas dos próprios membros" 
ON public.membros_equipe 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir remoção apenas dos próprios membros" 
ON public.membros_equipe 
FOR DELETE 
USING (auth.uid() = user_id);
