# Fluxo de Trabalho para Cadastro de Usuários no n8n

Este fluxo de trabalho processa o cadastro de usuários da aplicação SolandoX e cria registros correspondentes no Supabase, incluindo o número de telefone do usuário.

## Diagrama do Fluxo

```
[Webhook Trigger] --> [Extrair Dados do Usuário] --> [Verificar Usuário Existente] 
                                                      |
                                                      |--> [Se não existir] --> [Criar Usuário na Tabela users]
                                                      |                          |
                                                      |                          v
                                                      |                      [Criar Tabela do Usuário]
                                                      |                          |
                                                      |                          v
                                                      |                      [Enviar Email de Confirmação]
                                                      |
                                                      |--> [Se existir] --> [Enviar Notificação de Usuário Existente]
```

## Configuração Passo a Passo

### 1. Webhook Trigger
- **Endereço**: `https://webhook.dev.solandox.com/webhook/fintrack`
- **Método**: POST
- **Resposta**: 200 OK

### 2. Extrair Dados do Usuário
- Extrair do payload:
  - `email`
  - `username` (nome completo)
  - `password` (encriptado)
  - `phone` (número de telefone)
  - `timestamp`
  - `action` (verificar se é "signup" ou "cadastro")

### 3. Verificar Usuário Existente (Supabase)
- **Conexão**: Supabase
- **Operação**: Query
- **SQL**:
  ```sql
  SELECT * FROM users WHERE email = '{{$json.data.email}}' OR username = '{{$json.data.username}}'
  ```

### 4. Criar Usuário (Condição: se não existir)
- **Conexão**: Supabase
- **Operação**: Insert
- **Tabela**: users
- **Dados**:
  ```json
  {
    "username": "{{$json.data.username}}",
    "email": "{{$json.data.email}}",
    "password": "{{$json.data.password}}",
    "phone": "{{$json.data.phone}}",
    "created_at": "{{$json.data.timestamp || $now}}"
  }
  ```

### 5. Criar Tabela do Usuário (com base no ID gerado)
- **Conexão**: Supabase
- **Operação**: Query
- **SQL**:
  ```sql
  CREATE TABLE IF NOT EXISTS user_{{$node.SuaNodeDeInserção.json.id}}_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    phone VARCHAR(20) NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  INSERT INTO user_{{$node.SuaNodeDeInserção.json.id}}_data (
    user_id, phone, created_at
  ) VALUES (
    {{$node.SuaNodeDeInserção.json.id}},
    '{{$json.data.phone}}',
    '{{$json.data.timestamp || $now}}'
  );
  ```

### 6. Enviar Email de Confirmação
- **Conexão**: SMTP ou SendGrid
- **Operação**: Enviar email
- **Para**: `{{$json.data.email}}`
- **Assunto**: "Boas-vindas ao SolandoX - Confirme sua conta"
- **Corpo**:
  ```html
  <h1>Bem-vindo(a) ao SolandoX, {{$json.data.username}}!</h1>
  <p>Sua conta foi criada com sucesso. Use o código abaixo para confirmar seu cadastro:</p>
  <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 10px; margin: 20px 0; background-color: #f0f0f0; border-radius: 5px;">
    {{$randomNumber(6)}}
  </div>
  <p>Se você não solicitou esse cadastro, por favor ignore este email.</p>
  <p>Atenciosamente,<br>Equipe SolandoX</p>
  ```

### 7. Enviar Notificação de Usuário Existente (Condição: se existir)
- **Conexão**: SMTP ou SendGrid
- **Operação**: Enviar email
- **Para**: `{{$json.data.email}}`
- **Assunto**: "Tentativa de Cadastro no SolandoX"
- **Corpo**:
  ```html
  <h1>Olá!</h1>
  <p>Recebemos uma tentativa de cadastro com seu endereço de email no SolandoX.</p>
  <p>Se foi você quem tentou criar uma nova conta, lembre-se que já possui um cadastro conosco e pode fazer login normalmente.</p>
  <p>Se não foi você, sua conta continua segura e nenhuma ação é necessária.</p>
  <p>Atenciosamente,<br>Equipe SolandoX</p>
  ```

## Observações Importantes

1. **Validação**: Todos os dados devem ser validados antes da inserção no banco de dados.
2. **Segurança**: Senhas nunca devem ser armazenadas em texto puro, mas sempre encriptadas.
3. **Logs**: Manter logs de todas as operações para fins de auditoria.
4. **Tratamento de Erros**: Implementar tratamento adequado para falhas de conexão e outros erros.
5. **Número de Telefone**: O campo de telefone agora é obrigatório e deve ser armazenado tanto na tabela principal de usuários quanto na tabela específica do usuário.

## Implementação

Para implementar este fluxo no n8n:

1. Crie um novo fluxo de trabalho (workflow)
2. Adicione um nó de Webhook como trigger
3. Configure a conexão com o Supabase usando suas credenciais
4. Configure cada nó conforme descrito acima
5. Teste o fluxo com dados de exemplo antes de colocá-lo em produção

### Exemplo de Payload do Webhook:

```json
{
  "action": "signup",
  "entityType": "user",
  "entityId": "usuario@exemplo.com",
  "data": {
    "email": "usuario@exemplo.com",
    "username": "Nome Completo do Usuário",
    "password": "senhaencriptada",
    "phone": "(11) 98765-4321",
    "timestamp": "2025-04-22T11:30:00.000Z"
  }
}
```