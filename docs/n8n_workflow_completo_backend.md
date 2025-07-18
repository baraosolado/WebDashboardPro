# Fluxo de Trabalho Completo n8n - SolandoX (Backend Completo)

Este documento contém o fluxo de trabalho completo para n8n com todas as funcionalidades de backend do SolandoX, incluindo:

1. Autenticação de usuários (cadastro, login, verificação)
2. Gerenciamento de transações
3. Gerenciamento de categorias
4. Orçamentos e metas financeiras
5. Relatórios e análises
6. Webhooks para integração com o frontend

## Estrutura de Tabelas no Supabase

Antes de implementar os fluxos de trabalho, certifique-se de que as seguintes tabelas estão criadas no Supabase:

```sql
-- Tabela de usuários
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
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
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
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
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
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
```

## Fluxos de Trabalho Completos para n8n

O JSON completo abaixo contém todos os fluxos de trabalho necessários para o backend do SolandoX. Ele pode ser importado diretamente no n8n.

```json
{
  "name": "SolandoX - Backend Completo",
  "nodes": [
    {
      "parameters": {
        "path": "webhook/fintrack",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-principal",
      "name": "Webhook Principal",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "jsCode": "// Extrair dados principais\nconst action = $input.body.action;\nconst entityType = $input.body.entityType;\nconst entityId = $input.body.entityId;\nconst data = $input.body.data || {};\n\n// Adicionar timestamp se não fornecido\nif (!data.timestamp) {\n  data.timestamp = new Date().toISOString();\n}\n\n// Registrar a requisição para fins de debug\nconsole.log(`Recebida requisição: ${action}, tipo: ${entityType}, id: ${entityId}`);\n\n// Retornar dados estruturados\nreturn {\n  action,\n  entityType,\n  entityId,\n  data,\n  requestId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)\n};"
      },
      "id": "extrair-dados",
      "name": "Extrair Dados",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        450,
        300
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "signup"
            }
          ]
        }
      },
      "id": "router-principal",
      "name": "Router Principal",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        300
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "login_request"
            }
          ]
        }
      },
      "id": "router-autenticacao",
      "name": "Router Autenticação",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        450
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "verify_token"
            }
          ]
        }
      },
      "id": "router-verificacao",
      "name": "Router Verificação",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        600
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "transaction_create"
            }
          ]
        }
      },
      "id": "router-transacoes",
      "name": "Router Transações",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        750
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "category_create"
            }
          ]
        }
      },
      "id": "router-categorias",
      "name": "Router Categorias",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        900
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "budget_create"
            }
          ]
        }
      },
      "id": "router-orcamentos",
      "name": "Router Orçamentos",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        1050
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "goal_create"
            }
          ]
        }
      },
      "id": "router-metas",
      "name": "Router Metas",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        1200
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$node[\"Extrair Dados\"].json[\"action\"]}}",
              "operation": "equals",
              "value2": "report_generate"
            }
          ]
        }
      },
      "id": "router-relatorios",
      "name": "Router Relatórios",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        1350
      ]
    },
    
    // ##########################################################################
    // FLUXO DE CADASTRO DE USUÁRIOS
    // ##########################################################################
    
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "users",
        "limit": 1,
        "where": {
          "conditions": [
            {
              "condition": "OR",
              "values": [
                {
                  "column": "email",
                  "value": "={{$node[\"Extrair Dados\"].json.data.email}}"
                },
                {
                  "column": "username",
                  "value": "={{$node[\"Extrair Dados\"].json.data.username}}"
                }
              ]
            }
          ]
        }
      },
      "id": "verificar-usuario-existente",
      "name": "Verificar Usuário Existente",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        850,
        300
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$node[\"Verificar Usuário Existente\"].json.length}}",
              "operation": "equals",
              "value2": 0
            }
          ]
        }
      },
      "id": "usuario-existe",
      "name": "Usuário Existe?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        1050,
        300
      ]
    },
    {
      "parameters": {
        "jsCode": "// Gerar hash da senha - em produção usar bcrypt ou similar\n// Este é um exemplo simples para demonstração\nconst crypto = require('crypto');\nconst salt = crypto.randomBytes(16).toString('hex');\nconst password = $node[\"Extrair Dados\"].json.data.password;\nconst hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');\n\n// Retornar dados para criar o usuário\nreturn {\n  username: $node[\"Extrair Dados\"].json.data.username,\n  email: $node[\"Extrair Dados\"].json.data.email,\n  password: `${hashedPassword}.${salt}`, // Formato: hash.salt\n  phone: $node[\"Extrair Dados\"].json.data.phone || null,\n  preferences: JSON.stringify({\n    theme: 'light',\n    currency: 'BRL',\n    language: 'pt-BR',\n    notifications: true\n  }),\n  created_at: $node[\"Extrair Dados\"].json.data.timestamp\n};"
      },
      "id": "preparar-dados-usuario",
      "name": "Preparar Dados Usuário",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        1250,
        200
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "users",
        "columns": {
          "values": [
            {
              "column": "username",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.username}}"
            },
            {
              "column": "email",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.email}}"
            },
            {
              "column": "password",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.password}}"
            },
            {
              "column": "phone",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.phone}}"
            },
            {
              "column": "preferences",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.preferences}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Preparar Dados Usuário\"].json.created_at}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "criar-usuario",
      "name": "Criar Usuário",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1450,
        200
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Criar categorias padrão para o novo usuário\nconst userId = $input.json.id;\nconst timestamp = new Date().toISOString();\n\n// Categorias de receita\nconst incomeCategories = [\n  { name: 'Salário', color: '#4CAF50', type: 'income' },\n  { name: 'Investimentos', color: '#2196F3', type: 'income' },\n  { name: 'Freelance', color: '#9C27B0', type: 'income' },\n  { name: 'Outros', color: '#607D8B', type: 'income' }\n];\n\n// Categorias de despesa\nconst expenseCategories = [\n  { name: 'Alimentação', color: '#F44336', type: 'expense' },\n  { name: 'Moradia', color: '#FF9800', type: 'expense' },\n  { name: 'Transporte', color: '#795548', type: 'expense' },\n  { name: 'Lazer', color: '#E91E63', type: 'expense' },\n  { name: 'Saúde', color: '#00BCD4', type: 'expense' },\n  { name: 'Educação', color: '#3F51B5', type: 'expense' },\n  { name: 'Outros', color: '#9E9E9E', type: 'expense' }\n];\n\n// Montar valores para inserção no SQL\nconst allCategories = [...incomeCategories, ...expenseCategories];\nconst categoryValues = allCategories.map(cat => \n  `('${cat.name}', '${cat.type}', '${cat.color}', ${userId}, '${timestamp}')`\n).join(',\\n  ');\n\nconst sql = `\nINSERT INTO public.categories (name, type, color, user_id, created_at)\nVALUES\n  ${categoryValues}\nRETURNING id, name, type, color;\n`;\n\nreturn { sql, userId };"
      },
      "id": "preparar-categorias-padrao",
      "name": "Preparar Categorias Padrão",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        1650,
        200
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "={{$node[\"Preparar Categorias Padrão\"].json.sql}}"
      },
      "id": "criar-categorias-padrao",
      "name": "Criar Categorias Padrão",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1850,
        200
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Criar SQL para criar orçamentos padrão\nconst userId = $node[\"Preparar Categorias Padrão\"].json.userId;\nconst categories = $input.json;\nconst timestamp = new Date().toISOString();\n\n// Extrair categorias de despesa\nconst expenseCategories = categories.filter(cat => cat.type === 'expense');\n\n// Criar valores de orçamento padrão\nconst budgetValues = expenseCategories.map(cat => \n  `(${cat.id}, 1000.00, 'mensal', ${userId}, '${timestamp}')`\n).join(',\\n  ');\n\nconst sql = `\nINSERT INTO public.budgets (category_id, amount, period, user_id, created_at)\nVALUES\n  ${budgetValues}\nRETURNING id, category_id, amount, period;\n`;\n\nreturn { sql, userId };"
      },
      "id": "preparar-orcamentos-padrao",
      "name": "Preparar Orçamentos Padrão",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        2050,
        200
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "={{$node[\"Preparar Orçamentos Padrão\"].json.sql}}"
      },
      "id": "criar-orcamentos-padrao",
      "name": "Criar Orçamentos Padrão",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        2250,
        200
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "fromEmail": "noreply@solandox.com",
        "toEmail": "={{$node[\"Preparar Dados Usuário\"].json.email}}",
        "subject": "Bem-vindo ao SolandoX",
        "text": "",
        "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #4CAF50; padding: 20px; text-align: center; color: white;\">\n    <h1>SolandoX</h1>\n  </div>\n  \n  <div style=\"padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;\">\n    <h2>Bem-vindo(a) ao SolandoX, {{$node[\"Preparar Dados Usuário\"].json.username}}!</h2>\n    \n    <p>Sua conta foi criada com sucesso. Estamos felizes em ter você como parte da nossa comunidade.</p>\n    \n    <p>Com o SolandoX, você poderá:</p>\n    \n    <ul>\n      <li>Controlar suas receitas e despesas</li>\n      <li>Criar orçamentos personalizados</li>\n      <li>Estabelecer e acompanhar metas financeiras</li>\n      <li>Visualizar relatórios e insights sobre suas finanças</li>\n    </ul>\n    \n    <p>Para começar, faça login na plataforma e explore todas as funcionalidades disponíveis.</p>\n    \n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"https://solandox.com/login\" style=\"background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;\">ACESSAR MINHA CONTA</a>\n    </div>\n    \n    <p>Se tiver qualquer dúvida, não hesite em entrar em contato com nosso suporte.</p>\n    \n    <p>Atenciosamente,<br>Equipe SolandoX</p>\n  </div>\n  \n  <div style=\"padding: 15px; text-align: center; font-size: 12px; color: #666;\">\n    <p>© 2025 SolandoX. Todos os direitos reservados.</p>\n    <p>Se você não solicitou essa conta, <a href=\"mailto:suporte@solandox.com\">entre em contato conosco</a>.</p>\n  </div>\n</div>"
      },
      "id": "enviar-email-boas-vindas",
      "name": "Enviar Email Boas-vindas",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [
        2450,
        200
      ],
      "credentials": {
        "smtp": {
          "id": "cred_smtp",
          "name": "SMTP"
        }
      }
    },
    {
      "parameters": {
        "fromEmail": "noreply@solandox.com",
        "toEmail": "={{$node[\"Extrair Dados\"].json.data.email}}",
        "subject": "Tentativa de Cadastro no SolandoX",
        "text": "",
        "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #4CAF50; padding: 20px; text-align: center; color: white;\">\n    <h1>SolandoX</h1>\n  </div>\n  \n  <div style=\"padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;\">\n    <h2>Olá!</h2>\n    \n    <p>Recebemos uma tentativa de cadastro com seu endereço de email no SolandoX.</p>\n    \n    <p>Se foi você quem tentou criar uma nova conta, lembre-se que já possui um cadastro conosco e pode fazer login normalmente.</p>\n    \n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"https://solandox.com/login\" style=\"background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;\">FAZER LOGIN</a>\n    </div>\n    \n    <p>Se você esqueceu sua senha, você pode recuperá-la na página de login.</p>\n    \n    <p>Se não foi você, sua conta continua segura e nenhuma ação é necessária.</p>\n    \n    <p>Atenciosamente,<br>Equipe SolandoX</p>\n  </div>\n  \n  <div style=\"padding: 15px; text-align: center; font-size: 12px; color: #666;\">\n    <p>© 2025 SolandoX. Todos os direitos reservados.</p>\n  </div>\n</div>"
      },
      "id": "enviar-email-usuario-existente",
      "name": "Enviar Email Usuário Existente",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [
        1250,
        400
      ],
      "credentials": {
        "smtp": {
          "id": "cred_smtp",
          "name": "SMTP"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE LOGIN E AUTENTICAÇÃO
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Gerar token de 6 dígitos\nconst token = Math.floor(100000 + Math.random() * 900000).toString();\n\n// Definir tempo de expiração (10 minutos)\nconst now = new Date();\nconst expiresAt = new Date(now.getTime() + 10 * 60 * 1000);\n\n// Preparar dados\nconst email = $node[\"Extrair Dados\"].json.data.email;\n\nreturn {\n  token,\n  email,\n  created_at: now.toISOString(),\n  expires_at: expiresAt.toISOString(),\n  used: false\n};"
      },
      "id": "gerar-token",
      "name": "Gerar Token",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        450
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "auth_tokens",
        "columns": {
          "values": [
            {
              "column": "email",
              "value": "={{$node[\"Gerar Token\"].json.email}}"
            },
            {
              "column": "token",
              "value": "={{$node[\"Gerar Token\"].json.token}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Gerar Token\"].json.created_at}}"
            },
            {
              "column": "expires_at",
              "value": "={{$node[\"Gerar Token\"].json.expires_at}}"
            },
            {
              "column": "used",
              "value": false
            }
          ]
        }
      },
      "id": "salvar-token",
      "name": "Salvar Token",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        450
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "fromEmail": "noreply@solandox.com",
        "toEmail": "={{$node[\"Gerar Token\"].json.email}}",
        "subject": "SolandoX - Seu código de verificação",
        "text": "",
        "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #4CAF50; padding: 20px; text-align: center; color: white;\">\n    <h1>SolandoX</h1>\n  </div>\n  \n  <div style=\"padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;\">\n    <h2>Seu código de verificação</h2>\n    \n    <p>Olá,</p>\n    \n    <p>Recebemos uma solicitação de login na sua conta SolandoX. Use o código abaixo para completar o processo:</p>\n    \n    <div style=\"background-color: #ffffff; border: 1px solid #ddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;\">\n      {{$node[\"Gerar Token\"].json.token}}\n    </div>\n    \n    <p>Este código expira em 10 minutos.</p>\n    \n    <p>Se você não solicitou este código, ignore este email ou entre em contato com nosso suporte.</p>\n  </div>\n  \n  <div style=\"padding: 15px; text-align: center; font-size: 12px; color: #666;\">\n    <p>© 2025 SolandoX. Todos os direitos reservados.</p>\n  </div>\n</div>"
      },
      "id": "enviar-email-com-token",
      "name": "Enviar Email com Token",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [
        1250,
        450
      ],
      "credentials": {
        "smtp": {
          "id": "cred_smtp",
          "name": "SMTP"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "users",
        "columns": {
          "values": [
            {
              "column": "last_login",
              "value": "={{new Date().toISOString()}}"
            }
          ]
        },
        "where": {
          "values": [
            {
              "column": "email",
              "value": "={{$node[\"Gerar Token\"].json.email}}"
            }
          ]
        }
      },
      "id": "atualizar-ultimo-login",
      "name": "Atualizar Último Login",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1450,
        450
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE VERIFICAÇÃO DE TOKEN
    // ##########################################################################
    
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "auth_tokens",
        "order": {
          "values": [
            {
              "column": "created_at",
              "direction": "DESC"
            }
          ]
        },
        "limit": 1,
        "where": {
          "conditions": [
            {
              "condition": "AND",
              "values": [
                {
                  "column": "email",
                  "value": "={{$node[\"Extrair Dados\"].json.data.email}}"
                },
                {
                  "column": "token",
                  "value": "={{$node[\"Extrair Dados\"].json.data.token}}"
                },
                {
                  "column": "used",
                  "value": false
                },
                {
                  "column": "expires_at",
                  "condition": ">",
                  "value": "={{new Date().toISOString()}}"
                }
              ]
            }
          ]
        }
      },
      "id": "buscar-token",
      "name": "Buscar Token",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        850,
        600
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$node[\"Buscar Token\"].json.length}}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "id": "token-valido",
      "name": "Token Válido?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        1050,
        600
      ]
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "auth_tokens",
        "columns": {
          "values": [
            {
              "column": "used",
              "value": true
            }
          ]
        },
        "where": {
          "values": [
            {
              "column": "id",
              "value": "={{$node[\"Buscar Token\"].json[0].id}}"
            }
          ]
        }
      },
      "id": "marcar-token-como-usado",
      "name": "Marcar Token Como Usado",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1250,
        550
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "users",
        "where": {
          "values": [
            {
              "column": "email",
              "value": "={{$node[\"Extrair Dados\"].json.data.email}}"
            }
          ]
        }
      },
      "id": "buscar-usuario",
      "name": "Buscar Usuário",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1450,
        550
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE CRIAÇÃO DE TRANSAÇÕES
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Verificar e formatar os dados da transação\nconst { description, amount, date, type, category_id, user_id } = $node[\"Extrair Dados\"].json.data;\n\n// Validar tipo (income ou expense)\nif (type !== 'income' && type !== 'expense') {\n  throw new Error('Tipo de transação inválido. Deve ser \"income\" ou \"expense\".');\n}\n\n// Validar valor\nconst numAmount = parseFloat(amount);\nif (isNaN(numAmount) || numAmount <= 0) {\n  throw new Error('Valor da transação inválido. Deve ser um número positivo.');\n}\n\n// Formatar data\nlet formattedDate;\ntry {\n  formattedDate = new Date(date).toISOString().split('T')[0];\n} catch (e) {\n  throw new Error('Data inválida. Formato esperado: YYYY-MM-DD.');\n}\n\nreturn {\n  description: description.trim(),\n  amount: numAmount,\n  date: formattedDate,\n  type,\n  category_id: category_id || null,\n  user_id,\n  created_at: new Date().toISOString(),\n  notes: $node[\"Extrair Dados\"].json.data.notes || null,\n  attachments: $node[\"Extrair Dados\"].json.data.attachments || '[]'\n};"
      },
      "id": "preparar-dados-transacao",
      "name": "Preparar Dados Transação",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        750
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "transactions",
        "columns": {
          "values": [
            {
              "column": "description",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.description}}"
            },
            {
              "column": "amount",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.amount}}"
            },
            {
              "column": "date",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.date}}"
            },
            {
              "column": "type",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.type}}"
            },
            {
              "column": "category_id",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.category_id}}"
            },
            {
              "column": "user_id",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.user_id}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.created_at}}"
            },
            {
              "column": "notes",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.notes}}"
            },
            {
              "column": "attachments",
              "value": "={{$node[\"Preparar Dados Transacao\"].json.attachments}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "criar-transacao",
      "name": "Criar Transação",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        750
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Verificar se a transação está relacionada a alguma meta\nconst transaction = $input.json;\nconst userId = transaction.user_id;\n\n// Se for receita, não afeta metas\nif (transaction.type === 'income') {\n  return { skipGoalUpdate: true };\n}\n\n// Criar SQL para verificar e atualizar metas, caso a transação seja despesa\nconst sql = `\n-- Atualizar progresso de metas\nUPDATE public.goals\nSET \n  current_amount = CASE \n    -- Se a meta é de economia, subtrair despesas\n    WHEN (description ILIKE '%economia%' OR description ILIKE '%poupar%') \n    THEN GREATEST(current_amount - ${transaction.amount}, 0)\n    \n    -- Se a meta é específica para essa categoria de despesa, aumentar o progresso\n    WHEN EXISTS (\n      SELECT 1 \n      FROM public.categories \n      WHERE id = ${transaction.category_id || 0} \n      AND categories.id IN (\n        SELECT category_id \n        FROM public.goals_categories \n        WHERE goal_id = goals.id\n      )\n    ) THEN current_amount + ${transaction.amount}\n    \n    -- Caso contrário, não alterar\n    ELSE current_amount\n  END,\n  updated_at = NOW(),\n  is_completed = CASE \n    WHEN current_amount >= target_amount THEN true \n    ELSE is_completed \n  END\nWHERE user_id = ${userId};\n`;\n\nreturn { sql, userId, skipGoalUpdate: false };"
      },
      "id": "verificar-atualizacao-metas",
      "name": "Verificar Atualização Metas",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        1250,
        750
      ]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$node[\"Verificar Atualização Metas\"].json.skipGoalUpdate}}",
              "value2": true
            }
          ]
        }
      },
      "id": "atualizar-metas",
      "name": "Atualizar Metas?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        1450,
        750
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "={{$node[\"Verificar Atualização Metas\"].json.sql}}"
      },
      "id": "atualizar-metas-sql",
      "name": "Atualizar Metas SQL",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1650,
        700
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE CRIAÇÃO DE CATEGORIAS
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Verificar e formatar os dados da categoria\nconst { name, type, color, user_id } = $node[\"Extrair Dados\"].json.data;\n\n// Validar tipo (income ou expense)\nif (type !== 'income' && type !== 'expense') {\n  throw new Error('Tipo de categoria inválido. Deve ser \"income\" ou \"expense\".');\n}\n\n// Validar ou gerar cor\nlet validColor = color || '#CCCCCC';\nif (!/^#[0-9A-F]{6}$/i.test(validColor)) {\n  // Gerar cor aleatória se inválida\n  validColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');\n}\n\nreturn {\n  name: name.trim(),\n  type,\n  color: validColor,\n  user_id,\n  created_at: new Date().toISOString()\n};"
      },
      "id": "preparar-dados-categoria",
      "name": "Preparar Dados Categoria",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        900
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "categories",
        "columns": {
          "values": [
            {
              "column": "name",
              "value": "={{$node[\"Preparar Dados Categoria\"].json.name}}"
            },
            {
              "column": "type",
              "value": "={{$node[\"Preparar Dados Categoria\"].json.type}}"
            },
            {
              "column": "color",
              "value": "={{$node[\"Preparar Dados Categoria\"].json.color}}"
            },
            {
              "column": "user_id",
              "value": "={{$node[\"Preparar Dados Categoria\"].json.user_id}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Preparar Dados Categoria\"].json.created_at}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "criar-categoria",
      "name": "Criar Categoria",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        900
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE CRIAÇÃO DE ORÇAMENTOS
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Verificar e formatar os dados do orçamento\nconst { category_id, amount, period, user_id, start_date, end_date } = $node[\"Extrair Dados\"].json.data;\n\n// Validar valor\nconst numAmount = parseFloat(amount);\nif (isNaN(numAmount) || numAmount <= 0) {\n  throw new Error('Valor do orçamento inválido. Deve ser um número positivo.');\n}\n\n// Validar período\nif (!['mensal', 'semanal', 'anual'].includes(period)) {\n  throw new Error('Período inválido. Deve ser \"mensal\", \"semanal\" ou \"anual\".');\n}\n\n// Formatar datas\nlet formattedStartDate = start_date ? new Date(start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];\nlet formattedEndDate = end_date ? new Date(end_date).toISOString().split('T')[0] : null;\n\nreturn {\n  category_id: category_id || null,\n  amount: numAmount,\n  period,\n  user_id,\n  start_date: formattedStartDate,\n  end_date: formattedEndDate,\n  is_active: true,\n  created_at: new Date().toISOString()\n};"
      },
      "id": "preparar-dados-orcamento",
      "name": "Preparar Dados Orçamento",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        1050
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "budgets",
        "columns": {
          "values": [
            {
              "column": "category_id",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.category_id}}"
            },
            {
              "column": "amount",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.amount}}"
            },
            {
              "column": "period",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.period}}"
            },
            {
              "column": "user_id",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.user_id}}"
            },
            {
              "column": "start_date",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.start_date}}"
            },
            {
              "column": "end_date",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.end_date}}"
            },
            {
              "column": "is_active",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.is_active}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Preparar Dados Orcamento\"].json.created_at}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "criar-orcamento",
      "name": "Criar Orçamento",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        1050
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE CRIAÇÃO DE METAS
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Verificar e formatar os dados da meta\nconst { name, target_amount, current_amount, target_date, user_id, description } = $node[\"Extrair Dados\"].json.data;\n\n// Validar valor alvo\nconst numTargetAmount = parseFloat(target_amount);\nif (isNaN(numTargetAmount) || numTargetAmount <= 0) {\n  throw new Error('Valor alvo inválido. Deve ser um número positivo.');\n}\n\n// Validar valor atual (opcional)\nlet numCurrentAmount = current_amount ? parseFloat(current_amount) : 0;\nif (isNaN(numCurrentAmount) || numCurrentAmount < 0) {\n  numCurrentAmount = 0;\n}\n\n// Formatar data alvo\nlet formattedTargetDate;\ntry {\n  formattedTargetDate = new Date(target_date).toISOString().split('T')[0];\n  \n  // Verificar se a data está no futuro\n  if (new Date(formattedTargetDate) <= new Date()) {\n    throw new Error('A data alvo deve estar no futuro.');\n  }\n} catch (e) {\n  throw new Error('Data alvo inválida. Formato esperado: YYYY-MM-DD.');\n}\n\n// Verificar se a meta já foi atingida\nconst isCompleted = numCurrentAmount >= numTargetAmount;\n\nreturn {\n  name: name.trim(),\n  target_amount: numTargetAmount,\n  current_amount: numCurrentAmount,\n  target_date: formattedTargetDate,\n  user_id,\n  description: description || null,\n  is_completed: isCompleted,\n  created_at: new Date().toISOString(),\n  updated_at: new Date().toISOString()\n};"
      },
      "id": "preparar-dados-meta",
      "name": "Preparar Dados Meta",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        1200
      ]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "goals",
        "columns": {
          "values": [
            {
              "column": "name",
              "value": "={{$node[\"Preparar Dados Meta\"].json.name}}"
            },
            {
              "column": "target_amount",
              "value": "={{$node[\"Preparar Dados Meta\"].json.target_amount}}"
            },
            {
              "column": "current_amount",
              "value": "={{$node[\"Preparar Dados Meta\"].json.current_amount}}"
            },
            {
              "column": "target_date",
              "value": "={{$node[\"Preparar Dados Meta\"].json.target_date}}"
            },
            {
              "column": "user_id",
              "value": "={{$node[\"Preparar Dados Meta\"].json.user_id}}"
            },
            {
              "column": "description",
              "value": "={{$node[\"Preparar Dados Meta\"].json.description}}"
            },
            {
              "column": "is_completed",
              "value": "={{$node[\"Preparar Dados Meta\"].json.is_completed}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Preparar Dados Meta\"].json.created_at}}"
            },
            {
              "column": "updated_at",
              "value": "={{$node[\"Preparar Dados Meta\"].json.updated_at}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "criar-meta",
      "name": "Criar Meta",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        1200
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    
    // ##########################################################################
    // FLUXO DE GERAÇÃO DE RELATÓRIOS
    // ##########################################################################
    
    {
      "parameters": {
        "jsCode": "// Extrair parâmetros do relatório\nconst { user_id, report_type, period_start, period_end, categories } = $node[\"Extrair Dados\"].json.data;\n\n// Verificar tipo de relatório\nconst validReportTypes = ['summary', 'category_breakdown', 'trends', 'budget_performance', 'goals_progress'];\nif (!validReportTypes.includes(report_type)) {\n  throw new Error(`Tipo de relatório inválido. Deve ser um dos seguintes: ${validReportTypes.join(', ')}.`);\n}\n\n// Formatar datas\nlet start = period_start ? new Date(period_start) : new Date();\nstart.setMonth(start.getMonth() - 1); // Padrão: último mês\nlet end = period_end ? new Date(period_end) : new Date();\n\nconst formattedStart = start.toISOString().split('T')[0];\nconst formattedEnd = end.toISOString().split('T')[0];\n\n// Preparar SQL com base no tipo de relatório\nlet sql;\n\nswitch (report_type) {\n  case 'summary':\n    sql = `\n    SELECT\n      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,\n      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,\n      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance\n    FROM public.transactions\n    WHERE user_id = ${user_id}\n      AND date BETWEEN '${formattedStart}' AND '${formattedEnd}';\n    `;\n    break;\n  \n  case 'category_breakdown':\n    sql = `\n    SELECT\n      c.name AS category_name,\n      c.type AS category_type,\n      c.color,\n      COALESCE(SUM(t.amount), 0) AS total_amount,\n      COUNT(t.id) AS transaction_count\n    FROM public.categories c\n    LEFT JOIN public.transactions t ON c.id = t.category_id\n      AND t.date BETWEEN '${formattedStart}' AND '${formattedEnd}'\n    WHERE c.user_id = ${user_id}\n    GROUP BY c.id, c.name, c.type, c.color\n    ORDER BY c.type, total_amount DESC;\n    `;\n    break;\n  \n  case 'trends':\n    sql = `\n    SELECT\n      DATE_TRUNC('month', date) AS month,\n      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,\n      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expense,\n      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS monthly_balance\n    FROM public.transactions\n    WHERE user_id = ${user_id}\n      AND date BETWEEN '${formattedStart}' AND '${formattedEnd}'\n    GROUP BY DATE_TRUNC('month', date)\n    ORDER BY month;\n    `;\n    break;\n  \n  case 'budget_performance':\n    sql = `\n    WITH period_expenses AS (\n      SELECT\n        category_id,\n        COALESCE(SUM(amount), 0) AS spent\n      FROM public.transactions\n      WHERE user_id = ${user_id}\n        AND type = 'expense'\n        AND date BETWEEN '${formattedStart}' AND '${formattedEnd}'\n      GROUP BY category_id\n    )\n    SELECT\n      c.name AS category_name,\n      c.color,\n      b.amount AS budget_amount,\n      COALESCE(e.spent, 0) AS amount_spent,\n      CASE \n        WHEN b.amount > 0 THEN ROUND((COALESCE(e.spent, 0) / b.amount) * 100, 2)\n        ELSE 0\n      END AS percentage_used,\n      CASE\n        WHEN COALESCE(e.spent, 0) > b.amount THEN b.amount - COALESCE(e.spent, 0)\n        ELSE b.amount - COALESCE(e.spent, 0)\n      END AS remaining\n    FROM public.budgets b\n    JOIN public.categories c ON b.category_id = c.id\n    LEFT JOIN period_expenses e ON b.category_id = e.category_id\n    WHERE b.user_id = ${user_id}\n      AND b.is_active = true\n    ORDER BY percentage_used DESC;\n    `;\n    break;\n  \n  case 'goals_progress':\n    sql = `\n    SELECT\n      name,\n      target_amount,\n      current_amount,\n      target_date,\n      progress,\n      is_completed,\n      description\n    FROM public.goals\n    WHERE user_id = ${user_id}\n    ORDER BY target_date;\n    `;\n    break;\n}\n\nreturn {\n  user_id,\n  report_type,\n  period_start: formattedStart,\n  period_end: formattedEnd,\n  sql\n};"
      },
      "id": "preparar-relatorio",
      "name": "Preparar Relatório",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        1350
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "={{$node[\"Preparar Relatorio\"].json.sql}}"
      },
      "id": "gerar-dados-relatorio",
      "name": "Gerar Dados Relatório",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        1350
      ],
      "credentials": {
        "postgres": {
          "id": "cred_postgres",
          "name": "Supabase Postgres"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Formatar os dados do relatório para exibição\nconst reportType = $node[\"Preparar Relatorio\"].json.report_type;\nconst reportData = $input.json;\nconst periodStart = $node[\"Preparar Relatorio\"].json.period_start;\nconst periodEnd = $node[\"Preparar Relatorio\"].json.period_end;\n\n// Formatador de moeda\nconst formatCurrency = (value) => {\n  return new Intl.NumberFormat('pt-BR', {\n    style: 'currency',\n    currency: 'BRL'\n  }).format(value);\n};\n\n// Formatador de data\nconst formatDate = (dateStr) => {\n  return new Date(dateStr).toLocaleDateString('pt-BR');\n};\n\n// Formatar saída com base no tipo de relatório\nlet formattedReport = {\n  report_type: reportType,\n  period: {\n    start: formatDate(periodStart),\n    end: formatDate(periodEnd)\n  },\n  generated_at: formatDate(new Date().toISOString()),\n  data: {}\n};\n\nswitch (reportType) {\n  case 'summary':\n    formattedReport.data = {\n      total_income: formatCurrency(reportData[0].total_income),\n      total_expense: formatCurrency(reportData[0].total_expense),\n      balance: formatCurrency(reportData[0].balance),\n      savings_rate: reportData[0].total_income > 0 \n        ? `${Math.round(((reportData[0].total_income - reportData[0].total_expense) / reportData[0].total_income) * 100)}%`\n        : '0%'\n    };\n    break;\n  \n  case 'category_breakdown':\n    // Separar por tipo (receita/despesa)\n    const incomeCategories = reportData.filter(cat => cat.category_type === 'income');\n    const expenseCategories = reportData.filter(cat => cat.category_type === 'expense');\n    \n    formattedReport.data = {\n      income_categories: incomeCategories.map(cat => ({\n        name: cat.category_name,\n        color: cat.color,\n        amount: formatCurrency(cat.total_amount),\n        transaction_count: cat.transaction_count\n      })),\n      expense_categories: expenseCategories.map(cat => ({\n        name: cat.category_name,\n        color: cat.color,\n        amount: formatCurrency(cat.total_amount),\n        transaction_count: cat.transaction_count\n      }))\n    };\n    break;\n  \n  case 'trends':\n    formattedReport.data = {\n      months: reportData.map(month => ({\n        month: new Date(month.month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),\n        income: formatCurrency(month.monthly_income),\n        expense: formatCurrency(month.monthly_expense),\n        balance: formatCurrency(month.monthly_balance),\n        raw_data: {\n          income: month.monthly_income,\n          expense: month.monthly_expense,\n          balance: month.monthly_balance\n        }\n      }))\n    };\n    break;\n  \n  case 'budget_performance':\n    formattedReport.data = {\n      budgets: reportData.map(budget => ({\n        category: budget.category_name,\n        color: budget.color,\n        budget_amount: formatCurrency(budget.budget_amount),\n        spent: formatCurrency(budget.amount_spent),\n        remaining: formatCurrency(budget.remaining),\n        percentage_used: `${budget.percentage_used}%`,\n        status: budget.percentage_used > 100 ? 'exceeded' : \n               budget.percentage_used > 80 ? 'warning' : 'good'\n      }))\n    };\n    break;\n  \n  case 'goals_progress':\n    formattedReport.data = {\n      goals: reportData.map(goal => ({\n        name: goal.name,\n        description: goal.description,\n        target_amount: formatCurrency(goal.target_amount),\n        current_amount: formatCurrency(goal.current_amount),\n        target_date: formatDate(goal.target_date),\n        progress: `${goal.progress}%`,\n        status: goal.is_completed ? 'completed' : \n                new Date(goal.target_date) < new Date() ? 'overdue' : 'in_progress'\n      }))\n    };\n    break;\n}\n\nreturn formattedReport;"
      },
      "id": "formatar-relatorio",
      "name": "Formatar Relatório",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        1250,
        1350
      ]
    },
    
    // ##########################################################################
    // RESPOSTAS PARA WEBHOOKS
    // ##########################################################################
    
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Cadastro realizado com sucesso.\",\n  \"user\": {\n    \"id\": {{$node[\"Criar Usuário\"].json.id}},\n    \"username\": \"{{$node[\"Criar Usuário\"].json.username}}\",\n    \"email\": \"{{$node[\"Criar Usuário\"].json.email}}\"\n  }\n}",
        "options": {}
      },
      "id": "resposta-cadastro-sucesso",
      "name": "Resposta Cadastro Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        2650,
        200
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": false,\n  \"message\": \"Usuário ou email já cadastrado.\"\n}",
        "options": {
          "responseCode": 400
        }
      },
      "id": "resposta-usuario-existente",
      "name": "Resposta Usuário Existente",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1450,
        400
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Código de verificação enviado com sucesso.\",\n  \"requiresToken\": true\n}",
        "options": {}
      },
      "id": "resposta-token-enviado",
      "name": "Resposta Token Enviado",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1650,
        450
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Token verificado com sucesso.\",\n  \"user\": {\n    \"id\": {{$node[\"Buscar Usuário\"].json[0].id}},\n    \"username\": \"{{$node[\"Buscar Usuário\"].json[0].username}}\",\n    \"email\": \"{{$node[\"Buscar Usuário\"].json[0].email}}\"\n  }\n}",
        "options": {}
      },
      "id": "resposta-token-valido",
      "name": "Resposta Token Válido",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1650,
        550
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": false,\n  \"message\": \"Token inválido ou expirado.\"\n}",
        "options": {
          "responseCode": 401
        }
      },
      "id": "resposta-token-invalido",
      "name": "Resposta Token Inválido",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1250,
        650
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Transação criada com sucesso.\",\n  \"transaction\": {\n    \"id\": {{$node[\"Criar Transação\"].json.id}},\n    \"description\": \"{{$node[\"Criar Transação\"].json.description}}\",\n    \"amount\": {{$node[\"Criar Transação\"].json.amount}},\n    \"date\": \"{{$node[\"Criar Transação\"].json.date}}\",\n    \"type\": \"{{$node[\"Criar Transação\"].json.type}}\"\n  }\n}",
        "options": {}
      },
      "id": "resposta-transacao-criada",
      "name": "Resposta Transação Criada",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1850,
        750
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Categoria criada com sucesso.\",\n  \"category\": {\n    \"id\": {{$node[\"Criar Categoria\"].json.id}},\n    \"name\": \"{{$node[\"Criar Categoria\"].json.name}}\",\n    \"type\": \"{{$node[\"Criar Categoria\"].json.type}}\",\n    \"color\": \"{{$node[\"Criar Categoria\"].json.color}}\"\n  }\n}",
        "options": {}
      },
      "id": "resposta-categoria-criada",
      "name": "Resposta Categoria Criada",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1250,
        900
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Orçamento criado com sucesso.\",\n  \"budget\": {\n    \"id\": {{$node[\"Criar Orçamento\"].json.id}},\n    \"category_id\": {{$node[\"Criar Orçamento\"].json.category_id || 'null'}},\n    \"amount\": {{$node[\"Criar Orçamento\"].json.amount}},\n    \"period\": \"{{$node[\"Criar Orçamento\"].json.period}}\"\n  }\n}",
        "options": {}
      },
      "id": "resposta-orcamento-criado",
      "name": "Resposta Orçamento Criado",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1250,
        1050
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Meta criada com sucesso.\",\n  \"goal\": {\n    \"id\": {{$node[\"Criar Meta\"].json.id}},\n    \"name\": \"{{$node[\"Criar Meta\"].json.name}}\",\n    \"target_amount\": {{$node[\"Criar Meta\"].json.target_amount}},\n    \"current_amount\": {{$node[\"Criar Meta\"].json.current_amount}},\n    \"target_date\": \"{{$node[\"Criar Meta\"].json.target_date}}\",\n    \"progress\": {{$node[\"Criar Meta\"].json.progress || 0}}\n  }\n}",
        "options": {}
      },
      "id": "resposta-meta-criada",
      "name": "Resposta Meta Criada",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1250,
        1200
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Relatório gerado com sucesso.\",\n  \"report\": {{JSON.stringify($node[\"Formatar Relatorio\"].json)}}\n}",
        "options": {}
      },
      "id": "resposta-relatorio-gerado",
      "name": "Resposta Relatório Gerado",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1450,
        1350
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": false,\n  \"message\": \"Ação desconhecida ou não suportada.\"\n}",
        "options": {
          "responseCode": 400
        }
      },
      "id": "resposta-acao-desconhecida",
      "name": "Resposta Ação Desconhecida",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        850,
        1500
      ]
    }
  ],
  "connections": {
    "Webhook Principal": {
      "main": [
        [
          {
            "node": "Extrair Dados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extrair Dados": {
      "main": [
        [
          {
            "node": "Router Principal",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Autenticação",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Verificação",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Transações",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Categorias",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Orçamentos",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Metas",
            "type": "main",
            "index": 0
          },
          {
            "node": "Router Relatórios",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Principal": {
      "main": [
        [
          {
            "node": "Verificar Usuário Existente",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verificar Usuário Existente": {
      "main": [
        [
          {
            "node": "Usuário Existe?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Usuário Existe?": {
      "main": [
        [
          {
            "node": "Preparar Dados Usuário",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Enviar Email Usuário Existente",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Dados Usuário": {
      "main": [
        [
          {
            "node": "Criar Usuário",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Usuário": {
      "main": [
        [
          {
            "node": "Preparar Categorias Padrão",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Categorias Padrão": {
      "main": [
        [
          {
            "node": "Criar Categorias Padrão",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Categorias Padrão": {
      "main": [
        [
          {
            "node": "Preparar Orçamentos Padrão",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Orçamentos Padrão": {
      "main": [
        [
          {
            "node": "Criar Orçamentos Padrão",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Orçamentos Padrão": {
      "main": [
        [
          {
            "node": "Enviar Email Boas-vindas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar Email Boas-vindas": {
      "main": [
        [
          {
            "node": "Resposta Cadastro Sucesso",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar Email Usuário Existente": {
      "main": [
        [
          {
            "node": "Resposta Usuário Existente",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Autenticação": {
      "main": [
        [
          {
            "node": "Gerar Token",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gerar Token": {
      "main": [
        [
          {
            "node": "Salvar Token",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Salvar Token": {
      "main": [
        [
          {
            "node": "Enviar Email com Token",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enviar Email com Token": {
      "main": [
        [
          {
            "node": "Atualizar Último Login",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Último Login": {
      "main": [
        [
          {
            "node": "Resposta Token Enviado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Verificação": {
      "main": [
        [
          {
            "node": "Buscar Token",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar Token": {
      "main": [
        [
          {
            "node": "Token Válido?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Token Válido?": {
      "main": [
        [
          {
            "node": "Marcar Token Como Usado",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Token Inválido",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Marcar Token Como Usado": {
      "main": [
        [
          {
            "node": "Buscar Usuário",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar Usuário": {
      "main": [
        [
          {
            "node": "Resposta Token Válido",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Transações": {
      "main": [
        [
          {
            "node": "Preparar Dados Transação",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Dados Transação": {
      "main": [
        [
          {
            "node": "Criar Transação",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Transação": {
      "main": [
        [
          {
            "node": "Verificar Atualização Metas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verificar Atualização Metas": {
      "main": [
        [
          {
            "node": "Atualizar Metas?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Metas?": {
      "main": [
        [
          {
            "node": "Resposta Transação Criada",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Atualizar Metas SQL",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Metas SQL": {
      "main": [
        [
          {
            "node": "Resposta Transação Criada",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Categorias": {
      "main": [
        [
          {
            "node": "Preparar Dados Categoria",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Dados Categoria": {
      "main": [
        [
          {
            "node": "Criar Categoria",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Categoria": {
      "main": [
        [
          {
            "node": "Resposta Categoria Criada",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Orçamentos": {
      "main": [
        [
          {
            "node": "Preparar Dados Orçamento",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Dados Orçamento": {
      "main": [
        [
          {
            "node": "Criar Orçamento",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Orçamento": {
      "main": [
        [
          {
            "node": "Resposta Orçamento Criado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Metas": {
      "main": [
        [
          {
            "node": "Preparar Dados Meta",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Dados Meta": {
      "main": [
        [
          {
            "node": "Criar Meta",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Meta": {
      "main": [
        [
          {
            "node": "Resposta Meta Criada",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Router Relatórios": {
      "main": [
        [
          {
            "node": "Preparar Relatório",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Resposta Ação Desconhecida",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Relatório": {
      "main": [
        [
          {
            "node": "Gerar Dados Relatório",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gerar Dados Relatório": {
      "main": [
        [
          {
            "node": "Formatar Relatório",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Formatar Relatório": {
      "main": [
        [
          {
            "node": "Resposta Relatório Gerado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Exemplos de Payload para os Diferentes Endpoints

Aqui estão exemplos de payloads para testar os diferentes endpoints do fluxo de trabalho:

### 1. Cadastro de Usuário

```json
{
  "action": "signup",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "username": "Nome do Usuário",
    "password": "senhaSegura123",
    "phone": "11987654321",
    "timestamp": "2025-04-24T14:00:00Z"
  }
}
```

### 2. Login (Solicitação de Token)

```json
{
  "action": "login_request",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "password": "senhaSegura123"
  }
}
```

### 3. Verificação de Token

```json
{
  "action": "verify_token",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "token": "123456"
  }
}
```

### 4. Criação de Transação

```json
{
  "action": "transaction_create",
  "entityType": "transaction",
  "entityId": "nova-transacao",
  "data": {
    "description": "Compra de supermercado",
    "amount": 150.75,
    "date": "2025-04-24",
    "type": "expense",
    "category_id": 5,
    "user_id": 1,
    "notes": "Compras semanais"
  }
}
```

### 5. Criação de Categoria

```json
{
  "action": "category_create",
  "entityType": "category",
  "entityId": "nova-categoria",
  "data": {
    "name": "Viagens",
    "type": "expense",
    "color": "#FF5722",
    "user_id": 1
  }
}
```

### 6. Criação de Orçamento

```json
{
  "action": "budget_create",
  "entityType": "budget",
  "entityId": "novo-orcamento",
  "data": {
    "category_id": 5,
    "amount": 1000,
    "period": "mensal",
    "user_id": 1,
    "start_date": "2025-05-01"
  }
}
```

### 7. Criação de Meta

```json
{
  "action": "goal_create",
  "entityType": "goal",
  "entityId": "nova-meta",
  "data": {
    "name": "Fundo de emergência",
    "target_amount": 10000,
    "current_amount": 2500,
    "target_date": "2025-12-31",
    "user_id": 1,
    "description": "Acumular 6 meses de despesas básicas"
  }
}
```

### 8. Geração de Relatório

```json
{
  "action": "report_generate",
  "entityType": "report",
  "entityId": "novo-relatorio",
  "data": {
    "user_id": 1,
    "report_type": "summary",
    "period_start": "2025-01-01",
    "period_end": "2025-04-30"
  }
}
```

## Configuração do Webhook no Frontend

Para integrar o frontend com este fluxo de trabalho n8n, configure as chamadas API para apontar para o endpoint do webhook:

```javascript
const API_ENDPOINT = 'https://webhook.dev.solandox.com/webhook/fintrack';

// Função genérica para chamadas ao webhook
async function callWebhook(action, entityType, entityId, data) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        entityType,
        entityId,
        data,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao chamar webhook:', error);
    throw error;
  }
}
```

## Conclusão

Este fluxo de trabalho completo para n8n fornece todas as funcionalidades de backend necessárias para o SolandoX, incluindo:

1. **Autenticação segura em duas etapas**
2. **Gerenciamento completo de dados financeiros** (transações, categorias, orçamentos, metas)
3. **Geração de relatórios detalhados**
4. **Integração com sistemas de email para notificações**

O sistema é escalável e pode ser facilmente expandido com funcionalidades adicionais conforme necessário.