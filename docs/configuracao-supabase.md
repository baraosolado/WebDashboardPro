# Configuração do Supabase para o FinTrack

Este documento fornece instruções sobre como configurar o Supabase como backend para o aplicativo FinTrack.

## Pré-requisitos

1. Uma conta no [Supabase](https://supabase.com/)
2. Uma conta no [n8n](https://n8n.io/) para configurar os workflows

## Passo 1: Criar um projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com/) e faça login
2. Clique em "New Project"
3. Insira um nome para o projeto (ex: "fintrack")
4. Escolha uma senha para o banco de dados
5. Selecione a região mais próxima de você
6. Clique em "Create Project"

## Passo 2: Configurar as tabelas no Supabase

Execute os seguintes scripts SQL no editor SQL do Supabase:

```sql
-- Tabela de usuários
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de transações
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL,
    category_id INTEGER REFERENCES public.categories(id),
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de orçamentos
CREATE TABLE public.budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    amount DECIMAL(10, 2) NOT NULL,
    period VARCHAR(10) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de metas
CREATE TABLE public.goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    target_date DATE,
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Passo 3: Obter as credenciais do Supabase

1. No painel do Supabase, vá para "Settings" > "API"
2. Copie a "URL" e a "anon key" (chave anônima)
3. Guarde essas informações para uso posterior

## Passo 4: Configurar o n8n

1. Importe o arquivo de workflow `workflows/n8n-supabase-integration.json` para o n8n
2. Configure as credenciais do Supabase no n8n:
   - Vá para "Credentials" no n8n
   - Adicione uma nova credencial do tipo "Supabase API"
   - Insira o nome "Supabase API"
   - Insira a URL e a chave anônima do Supabase
   - Salve as credenciais

## Passo 5: Atualizar o arquivo .env da aplicação

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
DATABASE_URL=sua_url_supabase_postgres
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_anonima_supabase
WEBHOOK_URL=sua_url_webhook_n8n
```

## Passo 6: Atualizar a aplicação para usar o Supabase

1. No arquivo `server/storage.ts`, modifique a classe `DatabaseStorage` para usar o Supabase
2. No arquivo `server/routes.ts`, atualize o código para enviar solicitações para o webhook do n8n

## Suporte

Para qualquer problema ou dúvida sobre a configuração do Supabase ou n8n, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do n8n](https://docs.n8n.io/)