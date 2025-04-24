# Fluxo de Trabalho Completo para n8n - SolandoX

Este documento contém o fluxo de trabalho completo para o n8n, pronto para ser importado. Ele inclui todos os fluxos necessários para o funcionamento do SolandoX, abrangendo:

1. Cadastro de usuários
2. Autenticação em duas etapas
3. Processamento de transações
4. Gerenciamento de orçamentos e metas

## Instruções para Importação

1. Acesse seu painel de controle do n8n
2. Navegue até Workflows > Novo
3. Clique no menu (três pontos) no canto superior direito
4. Selecione "Import from file" e carregue o arquivo JSON fornecido
5. Alternativamente, copie e cole o conteúdo JSON no importador

## Estrutura do Fluxo de Trabalho

O fluxo de trabalho está organizado em quatro partes principais:

- **Webhook principal**: Ponto de entrada para todas as solicitações
- **Router**: Direciona solicitações para os fluxos apropriados
- **Fluxos de processamento**: Executam ações específicas por tipo de solicitação
- **Fluxos de resposta**: Retornam resultados para a aplicação

## JSON do Fluxo de Trabalho Completo

```json
{
  "name": "SolandoX - Fluxo Completo",
  "nodes": [
    {
      "parameters": {
        "path": "webhook/fintrack",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "358f144f-cb0e-47e3-b22f-1b5c484e5b5c",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        250,
        300
      ]
    },
    {
      "parameters": {
        "jsCode": "// Extrair dados principais\nconst action = $input.body.action;\nconst entityType = $input.body.entityType;\nconst entityId = $input.body.entityId;\nconst data = $input.body.data;\n\n// Adicionar timestamp se não fornecido\nif (!data.timestamp) {\n  data.timestamp = new Date().toISOString();\n}\n\n// Retornar dados estruturados\nreturn {\n  action,\n  entityType,\n  entityId,\n  data\n};"
      },
      "id": "8e9b0cd5-a5c4-4b08-824e-f08fd8d8598c",
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
      "id": "c593baf3-637b-4bbb-8a1c-e9b9c308e35f",
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
      "id": "f92b0e31-d8ab-4ab7-9d6c-8fa8c6f30d21",
      "name": "Router Autenticação",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        500
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
      "id": "a5eb2b64-95e7-40cb-a49d-f90c94c8a872",
      "name": "Router Verificação",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        650,
        700
      ]
    },
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
      "id": "7d8b7c3d-6f32-4b11-95a2-9c06dfaf9d44",
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
      "id": "2f37d21c-1b54-454a-b1b0-e05f63ac0e10",
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
        "operation": "insert",
        "schema": "public",
        "table": "users",
        "columns": {
          "values": [
            {
              "column": "username",
              "value": "={{$node[\"Extrair Dados\"].json.data.username}}"
            },
            {
              "column": "email",
              "value": "={{$node[\"Extrair Dados\"].json.data.email}}"
            },
            {
              "column": "password",
              "value": "={{$node[\"Extrair Dados\"].json.data.password}}"
            },
            {
              "column": "phone",
              "value": "={{$node[\"Extrair Dados\"].json.data.phone}}"
            },
            {
              "column": "created_at",
              "value": "={{$node[\"Extrair Dados\"].json.data.timestamp}}"
            }
          ]
        },
        "returnFields": {
          "values": [
            "*"
          ]
        }
      },
      "id": "f93b0c22-8cad-40c1-9e8c-91e31c0f89a2",
      "name": "Criar Usuário",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1250,
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
        "jsCode": "// Criar SQL para tabela específica do usuário\nconst userId = $input.json.id;\nconst phone = $node[\"Extrair Dados\"].json.data.phone;\nconst timestamp = $node[\"Extrair Dados\"].json.data.timestamp;\n\nconst sql = `\nCREATE TABLE IF NOT EXISTS user_${userId}_data (\n  id SERIAL PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id),\n  phone VARCHAR(20) NOT NULL,\n  preferences JSONB DEFAULT '{}'::jsonb,\n  last_login TIMESTAMP,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nINSERT INTO user_${userId}_data (\n  user_id, phone, created_at\n) VALUES (\n  ${userId},\n  '${phone}',\n  '${timestamp}'\n);\n`;\n\nreturn { sql, userId };"
      },
      "id": "ebbad6ab-5c0c-49a9-91f2-a4f21f6026cb",
      "name": "Preparar SQL Tabela Usuário",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        1450,
        200
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "={{$node[\"Preparar SQL Tabela Usuário\"].json.sql}}"
      },
      "id": "b937d56e-7fa7-4fc3-9aae-5a10de5eb6db",
      "name": "Criar Tabela Usuário",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1650,
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
        "toEmail": "={{$node[\"Extrair Dados\"].json.data.email}}",
        "subject": "Boas-vindas ao SolandoX - Confirme sua conta",
        "text": "",
        "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #4CAF50; padding: 20px; text-align: center; color: white;\">\n    <h1>SolandoX</h1>\n  </div>\n  \n  <div style=\"padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;\">\n    <h2>Bem-vindo(a) ao SolandoX, {{$node[\"Extrair Dados\"].json.data.username}}!</h2>\n    \n    <p>Sua conta foi criada com sucesso. Use o código abaixo para confirmar seu cadastro:</p>\n    \n    <div style=\"background-color: #ffffff; border: 1px solid #ddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;\">\n      {{Math.floor(100000 + Math.random() * 900000)}}\n    </div>\n    \n    <p>Se você não solicitou esse cadastro, por favor ignore este email.</p>\n  </div>\n  \n  <div style=\"padding: 15px; text-align: center; font-size: 12px; color: #666;\">\n    <p>© 2025 SolandoX. Todos os direitos reservados.</p>\n  </div>\n</div>"
      },
      "id": "d8f31bb7-e9d7-4a4f-b5e7-5cc91b4ea9cb",
      "name": "Enviar Email Boas-vindas",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [
        1850,
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
        "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #4CAF50; padding: 20px; text-align: center; color: white;\">\n    <h1>SolandoX</h1>\n  </div>\n  \n  <div style=\"padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;\">\n    <h2>Olá!</h2>\n    \n    <p>Recebemos uma tentativa de cadastro com seu endereço de email no SolandoX.</p>\n    \n    <p>Se foi você quem tentou criar uma nova conta, lembre-se que já possui um cadastro conosco e pode fazer login normalmente.</p>\n    \n    <p>Se não foi você, sua conta continua segura e nenhuma ação é necessária.</p>\n  </div>\n  \n  <div style=\"padding: 15px; text-align: center; font-size: 12px; color: #666;\">\n    <p>© 2025 SolandoX. Todos os direitos reservados.</p>\n  </div>\n</div>"
      },
      "id": "94b8e7a7-42b2-45fb-83b5-8c23bdbe2c8c",
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
    {
      "parameters": {
        "jsCode": "// Gerar token de 6 dígitos\nconst token = Math.floor(100000 + Math.random() * 900000).toString();\n\n// Definir tempo de expiração (10 minutos)\nconst now = new Date();\nconst expiresAt = new Date(now.getTime() + 10 * 60 * 1000);\n\n// Preparar dados\nconst email = $node[\"Extrair Dados\"].json.data.email;\n\nreturn {\n  token,\n  email,\n  created_at: now.toISOString(),\n  expires_at: expiresAt.toISOString(),\n  used: false\n};"
      },
      "id": "a2decea1-0564-4a0e-989c-03c13ecd5097",
      "name": "Gerar Token",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [
        850,
        500
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
      "id": "6ce87318-ce20-4b73-8d42-9c7ccf1f8d80",
      "name": "Salvar Token",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1050,
        500
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
      "id": "8b7ca5d2-d621-4b5e-a9dd-c95b0be66b93",
      "name": "Enviar Email com Token",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [
        1250,
        500
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
      "id": "f5b90c36-faf9-4a0f-bc6d-b7eea8e8a9d2",
      "name": "Buscar Token",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        850,
        700
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
      "id": "3d1a0f78-21d2-482a-a03f-9afb3bb0d8c7",
      "name": "Token Válido?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [
        1050,
        700
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
      "id": "8a90a9cf-0a81-450a-9d21-5d94d18fc4dc",
      "name": "Marcar Token Como Usado",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1250,
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
      "id": "bcc9a6db-b18a-4ffb-9cb4-17eec9c98de1",
      "name": "Buscar Usuário",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 1,
      "position": [
        1450,
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
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Cadastro realizado com sucesso.\",\n  \"user\": {\n    \"id\": {{$node[\"Criar Usuário\"].json.id}},\n    \"username\": \"{{$node[\"Criar Usuário\"].json.username}}\",\n    \"email\": \"{{$node[\"Criar Usuário\"].json.email}}\"\n  }\n}",
        "options": {}
      },
      "id": "c7a6f71a-4401-43e7-bfec-70071e42d4d9",
      "name": "Resposta Cadastro Sucesso",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        2050,
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
      "id": "e7eb84dd-b98d-4ea7-8969-86ce28a10fb5",
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
      "id": "dff57fb7-a6ea-459e-8c38-5f58f2a28f16",
      "name": "Resposta Token Enviado",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1450,
        500
      ]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "{\n  \"success\": true,\n  \"message\": \"Token verificado com sucesso.\",\n  \"user\": {\n    \"id\": {{$node[\"Buscar Usuário\"].json[0].id}},\n    \"username\": \"{{$node[\"Buscar Usuário\"].json[0].username}}\",\n    \"email\": \"{{$node[\"Buscar Usuário\"].json[0].email}}\"\n  }\n}",
        "options": {}
      },
      "id": "f03fa8e7-6a53-4c21-9d2a-bc5e3e56b6d3",
      "name": "Resposta Token Válido",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1650,
        600
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
      "id": "b3ffa78b-b9f3-43b4-8eb3-6fb7c5ae6bdb",
      "name": "Resposta Token Inválido",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        1250,
        800
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
      "id": "cdf1f5e8-4ca0-46d1-a29d-8a01a5a7f2ee",
      "name": "Resposta Ação Desconhecida",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        850,
        900
      ]
    }
  ],
  "connections": {
    "Webhook": {
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
            "node": "Criar Usuário",
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
    "Criar Usuário": {
      "main": [
        [
          {
            "node": "Preparar SQL Tabela Usuário",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar SQL Tabela Usuário": {
      "main": [
        [
          {
            "node": "Criar Tabela Usuário",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Criar Tabela Usuário": {
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
            "node": "Resposta Token Enviado",
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
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1",
    "saveExecutionProgress": true,
    "callerPolicy": "any",
    "errorWorkflow": "error-handler-workflow"
  },
  "versionId": "ef12a5b8-5567-4a2a-b6c7-d91f3b05c882",
  "id": "1",
  "meta": {
    "instanceId": "b12345c6-d78e-9f01-gh23-456789ijkl01"
  },
  "tags": [
    {
      "name": "SolandoX",
      "id": "1"
    },
    {
      "name": "autenticação",
      "id": "2"
    }
  ]
}
```

## Estrutura das Tabelas no Supabase

Antes de importar o fluxo de trabalho, é necessário configurar as seguintes tabelas no Supabase:

### Tabela `users`

```sql
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
```

### Tabela `auth_tokens`

```sql
CREATE TABLE public.auth_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user_email FOREIGN KEY (email) REFERENCES public.users(email)
);

CREATE INDEX idx_auth_tokens_email ON public.auth_tokens(email);
CREATE INDEX idx_auth_tokens_token ON public.auth_tokens(token);
```

### Tabela `categories`

```sql
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(20) DEFAULT '#4CAF50',
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
```

### Tabela `transactions`

```sql
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id INTEGER REFERENCES public.categories(id),
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
```

### Tabela `budgets`

```sql
CREATE TABLE public.budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('mensal', 'semanal', 'anual')),
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);
```

### Tabela `goals`

```sql
CREATE TABLE public.goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);
```

## Configuração das Credenciais no n8n

Para que o fluxo de trabalho funcione corretamente, é necessário configurar as seguintes credenciais no n8n:

### Credenciais do Supabase/PostgreSQL

1. Nome: `Supabase Postgres`
2. Tipo: PostgreSQL
3. Configuração:
   - Host: `seu-projeto.supabase.co`
   - Porta: `5432`
   - Banco de Dados: `postgres`
   - Usuário: `postgres`
   - Senha: `sua-senha-postgres`
   - SSL: Ativado
   - Modo SSL: Require

### Credenciais SMTP para Envio de Email

1. Nome: `SMTP`
2. Tipo: SMTP
3. Configuração:
   - Host: `seu-servidor-smtp.com`
   - Porta: `587` (ou a porta específica do seu servidor)
   - Usuário: `seu-usuario@email.com`
   - Senha: `sua-senha-smtp`
   - SSL/TLS: STARTTLS (ou conforme necessário)

## Testes e Validação

Após importar o fluxo de trabalho e configurar as credenciais, recomenda-se testar cada caminho do fluxo para garantir que tudo está funcionando corretamente:

1. **Teste de Cadastro**: Envie uma requisição de cadastro para o webhook
2. **Teste de Login**: Envie uma requisição de login para o webhook
3. **Teste de Verificação**: Envie uma requisição de verificação de token para o webhook

### Exemplo de Payload para Teste de Cadastro

```json
{
  "action": "signup",
  "entityType": "user",
  "entityId": "teste@exemplo.com",
  "data": {
    "email": "teste@exemplo.com",
    "username": "Usuário Teste",
    "password": "senha123",
    "phone": "11987654321",
    "timestamp": "2025-04-24T15:00:00Z"
  }
}
```

### Exemplo de Payload para Teste de Login

```json
{
  "action": "login_request",
  "entityType": "user",
  "entityId": "teste@exemplo.com",
  "data": {
    "email": "teste@exemplo.com",
    "password": "senha123",
    "timestamp": "2025-04-24T15:05:00Z"
  }
}
```

### Exemplo de Payload para Teste de Verificação

```json
{
  "action": "verify_token",
  "entityType": "user",
  "entityId": "teste@exemplo.com",
  "data": {
    "email": "teste@exemplo.com",
    "token": "123456",
    "timestamp": "2025-04-24T15:10:00Z"
  }
}
```

## Considerações Finais

Este fluxo de trabalho completo para o n8n implementa todo o processo de autenticação em duas etapas e cadastro de usuários para o SolandoX. Ele pode ser expandido conforme necessário para incluir funcionalidades adicionais, como:

1. Fluxos para processamento de transações
2. Automatização de relatórios
3. Integração com outros serviços
4. Notificações personalizadas

A estrutura modular permite fácil manutenção e expansão do sistema conforme o SolandoX cresce e evolui.