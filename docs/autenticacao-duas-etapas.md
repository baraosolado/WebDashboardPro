# Autenticação em Duas Etapas com Supabase e n8n

Este documento descreve a implementação do fluxo de autenticação em duas etapas da aplicação SolandoX, que utiliza Supabase para armazenamento de dados e n8n para processamento da verificação via token.

## Visão Geral do Fluxo de Autenticação

```
[Frontend] --> [Backend API] --> [Verificação no Supabase] --> [Webhook n8n] --> [Email com Token]
                                                                                       |
                                                                                       v
[Dashboard] <-- [Autorização] <-- [Validação Token] <-- [Frontend com Token] <-- [Usuário recebe token]
```

## Componentes do Sistema

### 1. Frontend (React/TypeScript)
- Formulário de login com email e senha
- Interface para inserção do código de verificação (6 dígitos)
- Redirecionamento para o dashboard após autenticação completa

### 2. Backend (Express/Node.js)
- Endpoints de API para autenticação
- Integração com Supabase para verificação de usuários
- Comunicação com webhook para processamento via n8n

### 3. Supabase
- Armazenamento de dados dos usuários
- Verificação da existência de usuários
- Recuperação de informações para autenticação

### 4. n8n
- Processamento de webhooks
- Geração e envio de tokens de verificação
- Validação dos tokens submetidos

## Fluxo Detalhado de Autenticação

### Etapa 1: Login Inicial

1. **Usuário submete credenciais**:
   - O usuário preenche email e senha no formulário de login
   - Frontend envia requisição para `/api/auth/login` sem token

2. **Verificação no Supabase**:
   - Backend verifica se o usuário existe no Supabase
   - Se o usuário não existir, retorna erro 401
   - Se o usuário existir, prossegue para próxima etapa

3. **Solicitação de Token**:
   - Backend envia requisição para webhook n8n com:
     ```json
     {
       "action": "login_request",
       "entityType": "user",
       "entityId": "email@usuario.com",
       "data": {
         "email": "email@usuario.com",
         "password": "senha_encriptada",
         "timestamp": "2025-04-24T12:00:00Z"
       }
     }
     ```
   - n8n processa a requisição e envia email com token de 6 dígitos
   - Backend retorna status 200 com `{ success: true, requiresToken: true }`

4. **Frontend exibe tela de verificação**:
   - Frontend recebe resposta e exibe interface para inserção do token
   - Usuário recebe email com o token de verificação

### Etapa 2: Verificação do Token

1. **Usuário submete token**:
   - Usuário insere token de 6 dígitos recebido por email
   - Frontend envia requisição para `/api/auth/login` com email, senha e token

2. **Validação do Token**:
   - Backend envia requisição para webhook n8n com:
     ```json
     {
       "action": "verify_token",
       "entityType": "user",
       "entityId": "email@usuario.com",
       "data": {
         "email": "email@usuario.com",
         "token": "123456",
         "timestamp": "2025-04-24T12:05:00Z"
       }
     }
     ```
   - n8n verifica se o token é válido para o usuário especificado

3. **Autenticação Completa**:
   - Se o token for válido, backend recupera informações do usuário do Supabase
   - Backend retorna status 200 com dados do usuário: `{ success: true, user: { username, email } }`
   - Frontend armazena dados do usuário e redireciona para o dashboard
   - Se o token for inválido, retorna erro 401

## Implementação no Código

### Backend (server/routes.ts)

```typescript
// Verificar login do usuário com Supabase
apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password, token } = req.body;
  
  // Se o token não foi fornecido, este é um login inicial
  if (!token) {
    // Verificar se o usuário existe no Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', username)
      .limit(1);
    
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas"
      });
    }
    
    // Enviar para webhook para verificação e geração de token
    await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login_request",
        entityType: "user",
        entityId: username,
        data: { email: username, password, timestamp: new Date().toISOString() },
      }),
    });
    
    // Retornar sucesso no primeiro passo
    return res.status(200).json({
      success: true,
      requiresToken: true,
      message: "Por favor, insira o token enviado para seu email."
    });
  } 
  // Se o token foi fornecido, este é o segundo passo da autenticação
  else {
    // Enviar para webhook para validar o token
    await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_token",
        entityType: "user",
        entityId: username,
        data: { email: username, token, timestamp: new Date().toISOString() },
      }),
    });
    
    // Buscar usuário no Supabase
    const { data: userData, error } = await supabase
      .from('users')
      .select('username, email')
      .eq('email', username)
      .single();
    
    if (error || !userData) {
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
  }
});
```

### Frontend (client/src/pages/auth-page.tsx)

```typescript
// Submissão do formulário de login
const onLoginSubmit = async (data: LoginFormValues) => {
  // Enviar dados para endpoint de login
  const loginResponse = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: data.email,
      password: data.password
    }),
  });
  
  const loginResult = await loginResponse.json();
  
  if (loginResponse.ok && loginResult.success) {
    // Se o login requer token, mostrar tela de verificação
    if (loginResult.requiresToken) {
      setShowVerification(true);
    } else {
      // Login direto sem token (não deve acontecer neste fluxo)
      login(loginResult.user.username);
      navigate("/");
    }
  }
};

// Verificação do token
const handleVerification = async () => {
  const code = codeInputs.join('');
  const formData = loginForm.getValues();
  
  // Chamar o endpoint de login com o token
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: formData.email,
      password: formData.password,
      token: code
    }),
  });
  
  const result = await response.json();
  
  if (response.ok && result.success) {
    // Login com sucesso, armazenar dados e redirecionar
    login(result.user.username);
    navigate("/");
  }
};
```

## Fluxo n8n para Verificação de Token

O fluxo no n8n para lidar com a verificação de token deve conter:

### 1. Nó de Webhook para receber solicitações
- Escuta no endpoint `https://webhook.dev.solandox.com/webhook/fintrack`
- Aceita solicitações POST com payload JSON

### 2. Switch para determinar ação com base em `action`
- Se `action` é "login_request": gerar e enviar token
- Se `action` é "verify_token": validar token enviado

### 3. Nó de geração e envio de token
- Gerar token numérico de 6 dígitos aleatório
- Salvar na tabela `auth_tokens` no Supabase com:
  - `email` do usuário
  - `token` gerado
  - `expires_at` (10 minutos no futuro)
- Enviar email com o token para o usuário

### 4. Nó de validação de token
- Verificar no Supabase se o token existe para o email especificado
- Verificar se o token não expirou
- Retornar resultado da validação

## Considerações de Segurança

1. **Tokens de curta duração**: Os tokens têm validade de 10 minutos para minimizar riscos
2. **Rate limiting**: Limitar tentativas de login e verificação por IP e usuário
3. **Tokens únicos**: Cada token é gerado aleatoriamente e é único para cada tentativa de login
4. **Armazenamento seguro**: Tokens são armazenados com hash no banco de dados
5. **HTTPS**: Toda comunicação é realizada via HTTPS para garantir confidencialidade

## Manutenção e Monitoramento

1. **Logs**: Manter logs detalhados de todas as tentativas de autenticação
2. **Alertas**: Configurar alertas para tentativas suspeitas de login
3. **Limpeza**: Remover tokens expirados periodicamente do banco de dados
4. **Auditoria**: Realizar auditorias regulares no fluxo de autenticação