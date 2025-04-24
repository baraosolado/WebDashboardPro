# Fluxo de Autenticação em Duas Etapas com n8n

Este documento descreve o fluxo de trabalho n8n que gerencia a autenticação em duas etapas do SolandoX, incluindo a geração, envio e validação de tokens.

## Diagrama do Fluxo

```
[Webhook Trigger] --> [Extrair Dados] --> [Determinar Ação] 
                                             |
                         +------------------+---------------+
                         |                                  |
                 [Login Request]                     [Verify Token]
                         |                                  |
                         v                                  v
                [Gerar Token]                     [Buscar Token no DB]
                         |                                  |
                         v                                  v
                [Salvar no Supabase]              [Verificar Validade]
                         |                                  |
                         v                                  v
                [Enviar Email]                     [Marcar Como Usado]
                         |                                  |
                         v                                  v
                [Resposta Webhook]                [Resposta Webhook]
```

## Configuração Detalhada

### 1. Webhook Trigger

- **Endpoint**: `https://webhook.dev.solandox.com/webhook/fintrack`
- **Método**: POST
- **Resposta**: 200 OK
- **Content-Type**: application/json

### 2. Extrair Dados

Extrai os dados relevantes do payload recebido:

- `action`: Tipo de ação solicitada ("login_request" ou "verify_token")
- `entityType`: Tipo da entidade (sempre "user" neste fluxo)
- `entityId`: Identificador da entidade (email do usuário)
- `data`: Objeto com informações específicas da ação

### 3. Determinar Ação

- **Tipo**: Switch Node
- **Condição**: Baseada no valor de `action`
- **Caminhos**:
  - `login_request`: Fluxo para geração e envio de token
  - `verify_token`: Fluxo para validação de token

## Fluxo de Login Request

### 4A. Gerar Token

- **Tipo**: Function Node
- **Operação**: Gerar token numérico aleatório de 6 dígitos
- **Código**:
  ```javascript
  // Gerar token de 6 dígitos
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Definir tempo de expiração (10 minutos)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  
  // Adicionar ao resultado
  return {
    ...item,
    token,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString()
  };
  ```

### 5A. Salvar Token no Supabase

- **Tipo**: Supabase Node
- **Operação**: Insert
- **Tabela**: auth_tokens
- **Dados**:
  ```json
  {
    "email": "{{$node.ExtractData.json.data.email}}",
    "token": "{{$node.GenerateToken.json.token}}",
    "created_at": "{{$node.GenerateToken.json.created_at}}",
    "expires_at": "{{$node.GenerateToken.json.expires_at}}",
    "used": false
  }
  ```

### 6A. Enviar Email com Token

- **Tipo**: Send Email Node
- **Configuração**:
  - **Para**: `{{$node.ExtractData.json.data.email}}`
  - **Assunto**: "SolandoX - Seu código de verificação"
  - **Corpo HTML**:
    ```html
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
        <h1>SolandoX</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;">
        <h2>Seu código de verificação</h2>
        
        <p>Olá,</p>
        
        <p>Recebemos uma solicitação de login na sua conta SolandoX. Use o código abaixo para completar o processo:</p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          {{$node.GenerateToken.json.token}}
        </div>
        
        <p>Este código expira em 10 minutos.</p>
        
        <p>Se você não solicitou este código, ignore este email ou entre em contato com nosso suporte.</p>
      </div>
      
      <div style="padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© 2025 SolandoX. Todos os direitos reservados.</p>
      </div>
    </div>
    ```

### 7A. Resposta do Webhook

- **Tipo**: Respond to Webhook Node
- **Resposta**:
  ```json
  {
    "success": true,
    "message": "Código de verificação enviado com sucesso."
  }
  ```

## Fluxo de Verificação de Token

### 4B. Buscar Token no Supabase

- **Tipo**: Supabase Node
- **Operação**: Select
- **Tabela**: auth_tokens
- **Condições**:
  - `email` = `{{$node.ExtractData.json.data.email}}`
  - `token` = `{{$node.ExtractData.json.data.token}}`
  - `used` = `false`
  - `expires_at` > `{{$now.toISOString()}}`
- **Ordenar**: `created_at DESC`
- **Limite**: 1

### 5B. Verificar Validade do Token

- **Tipo**: If Node
- **Condição**: `{{$node.QueryTokens.json.length > 0}}`
- **Verdadeiro**: Token válido, continua para marcar como usado
- **Falso**: Retorna erro de token inválido

### 6B. Marcar Token Como Usado

- **Tipo**: Supabase Node
- **Operação**: Update
- **Tabela**: auth_tokens
- **Condição**: `id` = `{{$node.QueryTokens.json[0].id}}`
- **Dados**:
  ```json
  {
    "used": true
  }
  ```

### 7B. Supabase: Recuperar Informações do Usuário

- **Tipo**: Supabase Node
- **Operação**: Select
- **Tabela**: users
- **Condição**: `email` = `{{$node.ExtractData.json.data.email}}`

### 8B. Resposta do Webhook (Token Válido)

- **Tipo**: Respond to Webhook Node
- **Resposta**:
  ```json
  {
    "success": true,
    "message": "Token verificado com sucesso.",
    "user": {
      "id": "{{$node.GetUserInfo.json[0].id}}",
      "username": "{{$node.GetUserInfo.json[0].username}}",
      "email": "{{$node.GetUserInfo.json[0].email}}"
    }
  }
  ```

### 9B. Resposta do Webhook (Token Inválido)

- **Tipo**: Respond to Webhook Node
- **Resposta**:
  ```json
  {
    "success": false,
    "message": "Token inválido ou expirado."
  }
  ```

## Testes e Monitoramento

### Cenários de Teste

1. **Login Inicial**:
   - Enviar requisição com email/senha corretos
   - Verificar se token é gerado e armazenado corretamente
   - Verificar se email é enviado

2. **Verificação com Token Válido**:
   - Enviar token correto dentro do período de validade
   - Verificar se autenticação é bem-sucedida
   - Verificar se token é marcado como usado

3. **Verificação com Token Inválido**:
   - Enviar token incorreto
   - Verificar se erro apropriado é retornado

4. **Verificação com Token Expirado**:
   - Enviar token correto após período de validade
   - Verificar se erro apropriado é retornado

5. **Verificação com Token Já Utilizado**:
   - Enviar token já utilizado
   - Verificar se erro apropriado é retornado

### Monitoramento

- **Logs**: Configurar registro de todas as operações importantes
- **Alertas**: Configurar alertas para falhas críticas
- **Métricas**: Monitorar tempo de resposta e taxas de sucesso
- **Auditoria**: Manter registros para revisão periódica

## Exemplos de Payload

### Login Request

```json
{
  "action": "login_request",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "password": "senha_encriptada",
    "timestamp": "2025-04-24T14:30:00.000Z"
  }
}
```

### Verify Token

```json
{
  "action": "verify_token",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "token": "123456",
    "timestamp": "2025-04-24T14:35:00.000Z"
  }
}
```

## Considerações de Segurança

1. **Limitação de Taxa**: Implementar limitação de tentativas para prevenir ataques de força bruta
2. **Tokens de Uso Único**: Cada token só pode ser usado uma vez
3. **Expiração de Tokens**: Tokens expiram após 10 minutos
4. **Limpeza Automática**: Remover tokens antigos periodicamente

## Integração com o Sistema

Este fluxo n8n é uma parte crucial do sistema de autenticação do SolandoX, trabalhando em conjunto com:

1. **Frontend**: Interface de usuário para inserção de credenciais e tokens
2. **Backend**: API que se comunica com n8n e Supabase
3. **Supabase**: Banco de dados para armazenamento persistente

A integração desses componentes proporciona um sistema de autenticação em duas etapas seguro e eficiente, adequado para um ambiente SaaS profissional.