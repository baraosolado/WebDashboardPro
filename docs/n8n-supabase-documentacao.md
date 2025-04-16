# Documentação do Workflow FinTrack para n8n e Supabase

Este documento explica como configurar e usar o workflow completo do FinTrack com n8n e Supabase.

## Visão Geral

O workflow `fintrack-completo.json` é um sistema completo de processamento de eventos do FinTrack que:

1. Recebe eventos de webhook do FinTrack para todos os tipos de entidades
2. Processa e mapeia os dados recebidos
3. Realiza operações CRUD no Supabase conforme o tipo de ação
4. Registra logs de operação
5. Retorna respostas formatadas

## Pré-requisitos

1. Uma conta no [Supabase](https://supabase.com/)
2. Uma instância do [n8n](https://n8n.io/) configurada 
3. As tabelas do FinTrack criadas no Supabase (ver `docs/configuracao-supabase.md`)

## Importando o Workflow

1. Acesse sua instância do n8n
2. Clique em "Workflows" no menu lateral
3. Clique em "Import from File"
4. Selecione o arquivo `workflows/fintrack-completo.json`
5. Clique em "Import"

## Configurando Credenciais do Supabase

1. No n8n, vá para "Credentials" no menu lateral
2. Clique em "Add Credential"
3. Selecione "Supabase API"
4. Preencha:
   - Nome: `Supabase API`
   - URL da API: `sua_url_supabase` (encontrado em Project Settings > API)
   - API Key: `sua_chave_anonima` (encontrado em Project Settings > API > anon key)
5. Clique em "Create"

## Estrutura do Workflow

O workflow é organizado em várias seções:

### 1. Recepção de Eventos
O nó "Webhook de Entrada" recebe todos os eventos do FinTrack.

### 2. Classificação do Evento
Os nós "Tipo de Entidade" e "Ação do X" classificam o evento recebido:

- **Tipo de Entidade**: user, transaction, category, budget, goal
- **Ação**: create, update, delete, login, signup, addFundsToGoal

### 3. Mapeamento de Dados
Nós "Mapear X" transformam os dados recebidos no formato adequado para o Supabase.

### 4. Operações no Supabase
Nós "X (Supabase)" realizam operações de banco de dados:
- Criar (insert)
- Atualizar (update)
- Excluir (delete)
- Consultar (select)

### 5. Log e Resposta
- "Registrar Log de Operação" registra a execução
- "Resposta de Sucesso" formata a resposta para o cliente

## Formato de Eventos

O workflow espera eventos no seguinte formato:

```json
{
  "action": "create|update|delete|login|signup|addFundsToGoal",
  "entityType": "user|transaction|category|budget|goal",
  "entityId": "id_opcional",
  "data": {
    // Os dados específicos da entidade
  }
}
```

### Exemplos de Payloads

#### Cadastro de Usuário
```json
{
  "action": "signup",
  "entityType": "user",
  "data": {
    "email": "usuario@example.com",
    "password": "senha123",
    "username": "usuario"
  }
}
```

#### Login de Usuário
```json
{
  "action": "login",
  "entityType": "user",
  "data": {
    "email": "usuario@example.com",
    "password": "senha123"
  }
}
```

#### Criação de Transação
```json
{
  "action": "create",
  "entityType": "transaction",
  "data": {
    "description": "Compra supermercado",
    "amount": 157.90,
    "type": "expense",
    "date": "2025-04-16",
    "categoryId": 2,
    "userId": 1
  }
}
```

#### Adicionar Fundos à Meta
```json
{
  "action": "addFundsToGoal",
  "entityType": "goal",
  "data": {
    "goalId": 1,
    "amount": 200,
    "currentAmount": 500
  }
}
```

## Ativando o Workflow

1. Ative o workflow clicando no botão "Active" no canto superior direito
2. Copie a URL do webhook exibida no nó "Webhook de Entrada"
3. Configure esta URL no FinTrack (variável de ambiente `WEBHOOK_URL`)

## Integração com o FinTrack

Para integrar este workflow com o FinTrack:

1. Atualize a variável de ambiente `WEBHOOK_URL` no FinTrack com a URL do webhook do n8n
2. Configure as variáveis de ambiente do Supabase no FinTrack:
   - `SUPABASE_URL`: URL da sua instância do Supabase
   - `SUPABASE_KEY`: Chave anônima do Supabase

## Testando o Workflow

Para testar manualmente o workflow:

1. No n8n, clique no nó "Webhook de Entrada"
2. Selecione a aba "Test" no painel de detalhes do nó
3. Use uma ferramenta como Postman ou curl para enviar solicitações POST para a URL do webhook com payloads de exemplo

## Solução de Problemas

### Erro na conexão com o Supabase
- Verifique se as credenciais do Supabase estão corretas
- Certifique-se de que as tabelas existem no esquema 'public'

### Webhook não recebe eventos
- Verifique se o workflow está ativo
- Confirme se a URL do webhook está corretamente configurada no FinTrack
- Verifique se o n8n está acessível publicamente ou através de um túnel

### Erros de mapeamento de dados
- Verifique os formatos de dados enviados pelo FinTrack
- Compare com os exemplos de payload nesta documentação

## Adaptação e Personalização

Você pode modificar este workflow para:

1. Adicionar novos tipos de entidades
2. Implementar validações adicionais
3. Adicionar notificações por email, SMS, ou outros canais
4. Integrar com outros serviços além do Supabase