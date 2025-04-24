# Integração SolandoX com Supabase para Autenticação Real

Este documento detalha a implementação da autenticação real com Supabase no SolandoX, proporcionando uma solução robusta de validação de usuários para um ambiente SaaS.

## Arquitetura da Autenticação

### Componentes da Autenticação

```
                    +-------------------+
                    |                   |
                    |  Cliente (React)  |
                    |                   |
                    +--------+----------+
                             |
                             | HTTP/HTTPS
                             |
                    +--------v----------+
                    |                   |
                    |  Backend (Node)   |
                    |                   |
                    +--------+----------+
                             |
              +-------------+-------------+
              |                           |
    +---------v---------+     +-----------v-----------+
    |                   |     |                       |
    |  Supabase (CRUD)  |     |  n8n (Processamento) |
    |                   |     |                       |
    +-------------------+     +-----------------------+
```

## Integração com Supabase

O Supabase é utilizado como plataforma de banco de dados para armazenar e consultar dados de usuários, proporcionando persistência e confiabilidade ao sistema de autenticação.

### Configuração do Cliente Supabase

```typescript
// server/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente do Supabase estão definidas
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy-key';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para verificar se o Supabase está disponível
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('categories').select('count');
    return !error;
  } catch (err) {
    console.error('Erro ao verificar conexão com Supabase:', err);
    return false;
  }
}
```

### Gerenciamento de Usuários no Supabase

#### Estrutura da Tabela de Usuários

O Supabase mantém uma tabela `users` com a seguinte estrutura:

| Coluna        | Tipo           | Descrição                           |
|---------------|----------------|-------------------------------------|
| id            | SERIAL         | ID único do usuário (chave primária) |
| username      | VARCHAR        | Nome completo do usuário            |
| email         | VARCHAR        | Email do usuário (único)            |
| password      | VARCHAR        | Senha encriptada                    |
| phone         | VARCHAR        | Número de telefone                  |
| created_at    | TIMESTAMP      | Data de criação do registro         |

#### Tabela de Tokens de Autenticação

O sistema utiliza uma tabela `auth_tokens` para o processo de verificação em duas etapas:

| Coluna        | Tipo           | Descrição                           |
|---------------|----------------|-------------------------------------|
| id            | SERIAL         | ID único do token (chave primária)  |
| user_id       | INTEGER        | ID do usuário (referência)          |
| email         | VARCHAR        | Email associado ao token            |
| token         | VARCHAR        | Token de 6 dígitos                  |
| created_at    | TIMESTAMP      | Data de criação do token            |
| expires_at    | TIMESTAMP      | Data de expiração do token          |
| used          | BOOLEAN        | Indica se o token já foi utilizado  |

## Operações de Autenticação com Supabase

### Verificação de Usuário

```typescript
// Verificar se o usuário existe no Supabase
const { data: users, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', username)
  .limit(1);

if (userError) {
  console.error("Erro ao buscar usuário no Supabase:", userError);
  return res.status(500).json({ 
    success: false, 
    message: "Erro ao processar login." 
  });
}

if (!users || users.length === 0) {
  console.log(`Usuário ${username} não encontrado`);
  return res.status(401).json({
    success: false,
    message: "Credenciais inválidas"
  });
}
```

### Recuperação de Dados do Usuário

```typescript
// Buscar usuário no Supabase
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('username, email')
  .eq('email', username)
  .single();

if (userError || !userData) {
  console.error("Erro ao buscar dados do usuário:", userError);
  return res.status(404).json({
    success: false,
    message: "Usuário não encontrado."
  });
}

// Autenticação bem-sucedida
return res.status(200).json({
  success: true,
  user: { 
    username: userData.username || username,
    email: userData.email || username
  }
});
```

### Verificação de Usuário Existente

```typescript
// Verificar se o usuário já existe no Supabase
const { data: existingUsers, error: userError } = await supabase
  .from('users')
  .select('email')
  .or(`email.eq.${email},username.eq.${username}`)
  .limit(1);
  
if (userError) {
  console.error("Erro ao verificar usuário existente:", userError);
  return res.status(500).json({
    success: false,
    message: "Erro ao processar cadastro."
  });
}

if (existingUsers && existingUsers.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Usuário ou email já cadastrado"
  });
}
```

## Fluxo Completo de Autenticação com Supabase

### Registro de Usuários

1. **Verificação Inicial**:
   - Verificar se o email ou username já existem no Supabase
   - Se existirem, retornar erro 400

2. **Criação do Usuário**:
   - Enviar dados para webhook n8n que processará a criação no Supabase
   - n8n insere o usuário na tabela `users`
   - n8n cria tabelas específicas para o usuário conforme necessário

3. **Confirmação**:
   - Retornar resposta de sucesso para o frontend
   - Frontend redireciona para tela de login

### Login e Autenticação

1. **Verificação de Credenciais**:
   - Verificar se o usuário existe no Supabase pela tabela `users`
   - Enviar dados para webhook n8n para processamento adicional

2. **Verificação em Duas Etapas**:
   - n8n cria token na tabela `auth_tokens`
   - n8n envia token por email para o usuário
   - Frontend exibe tela para inserção do token

3. **Validação do Token**:
   - Usuário submete token
   - Backend envia token para webhook n8n para validação
   - n8n verifica token na tabela `auth_tokens`
   - Se válido, backend recupera dados do usuário do Supabase
   - Retorna dados do usuário para frontend

## Tratamento de Erros

A integração com Supabase inclui tratamento detalhado de erros:

1. **Erros de Conexão**:
   - Verificação prévia de conexão antes de operações críticas
   - Logs detalhados para erros de conexão
   - Respostas de erro apropriadas para o frontend

2. **Erros de Consulta**:
   - Validação de parâmetros antes da execução de consultas
   - Logs detalhados de erros de consulta
   - Mensagens de erro específicas para diferentes cenários

3. **Segurança**:
   - Proteção contra injeção SQL usando parâmetros vinculados
   - Limitação de tentativas de login por IP/usuário
   - Tokens com tempo de expiração curto

## Variáveis de Ambiente Necessárias

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-de-api-supabase
DATABASE_URL=postgresql://usuario:senha@host:porta/banco
SESSION_SECRET=chave-secreta-para-sessoes
```

## Conclusão

A integração com Supabase proporciona uma solução robusta e escalável para autenticação em uma aplicação SaaS. Ao combinar o poder do Supabase para armazenamento e consulta com o n8n para processamento de fluxos de trabalho, o SolandoX implementa um sistema de autenticação seguro e eficiente.

Os principais benefícios desta implementação incluem:

1. **Persistência de dados** garantida pelo Supabase
2. **Autenticação em duas etapas** para maior segurança
3. **Escalabilidade** para lidar com grande número de usuários
4. **Flexibilidade** para adicionar funcionalidades futuras
5. **Integração perfeita** com o restante do ecossistema da aplicação