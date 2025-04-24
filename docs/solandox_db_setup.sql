-- Script SQL para criação das tabelas do SolandoX no Supabase

-- Tabela de usuários
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Armazenar hash da senha
    phone VARCHAR(20),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Tabela de tokens de autenticação
CREATE TABLE public.auth_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user_email FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE
);

-- Tabela de categorias
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(20) DEFAULT '#4CAF50',
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT
);

-- Tabela de orçamentos
CREATE TABLE public.budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('mensal', 'semanal', 'anual')),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de metas financeiras
CREATE TABLE public.goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    description TEXT,
    progress DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN target_amount > 0 
        THEN LEAST((current_amount / target_amount) * 100, 100)
        ELSE 0 END
    ) STORED,
    is_completed BOOLEAN DEFAULT FALSE
);

-- Tabela de associação entre metas e categorias
CREATE TABLE public.goals_categories (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER REFERENCES public.goals(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    UNIQUE(goal_id, category_id)
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_auth_tokens_email ON public.auth_tokens(email);
CREATE INDEX idx_auth_tokens_token ON public.auth_tokens(token);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);

-- Permissões RLS para segurança
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals_categories ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem ver apenas seus próprios dados" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Políticas para categorias
CREATE POLICY "Usuários podem ver apenas suas próprias categorias" ON public.categories
    FOR SELECT
    USING (auth.uid() = user_id);

-- Políticas para transações
CREATE POLICY "Usuários podem ver apenas suas próprias transações" ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Políticas para orçamentos
CREATE POLICY "Usuários podem ver apenas seus próprios orçamentos" ON public.budgets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Políticas para metas
CREATE POLICY "Usuários podem ver apenas suas próprias metas" ON public.goals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();