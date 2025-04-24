# Configuração de Webhook Direto

## Alterações Realizadas

Conforme solicitado, configuramos o sistema para enviar requisições diretamente para o webhook externo:

```
https://webhook.dev.solandox.com/webhook/fintrack
```

As seguintes alterações foram feitas no código:

1. Removemos o sistema de mockup local que havia sido implementado anteriormente
2. Configuramos todas as chamadas para usar o endpoint externo solicitado
3. Atualizamos o código para lidar adequadamente com os tipos de resposta

O código agora envia todas as requisições de webhook para:

```typescript
const n8nWebhookUrl = "https://webhook.dev.solandox.com/webhook/fintrack";
```

## Pontos de Integração

Todos os seguintes fluxos agora usam o webhook externo:

1. **Autenticação**
   - Login inicial (login_request)
   - Verificação de token (verify_token)
   - Registro de usuários (signup)

2. **Transações**
   - Criação de transações (transaction_create)
   - Atualização de transações (transaction_update)
   - Exclusão de transações (transaction_delete)

3. **Categorias**
   - Criação/atualização de categorias (category_create, category_update)

4. **Orçamentos**
   - Operações com orçamentos (budget_create, budget_update)

5. **Metas**
   - Operações com metas financeiras (goal_create, goal_update)

## Formato da Requisição

Todas as requisições para o webhook seguem o formato padrão:

```json
{
  "action": "nome_da_acao",
  "entityType": "tipo_da_entidade",
  "entityId": "id_da_entidade",
  "data": {
    /* dados específicos da ação */
  }
}
```

## Tratamento de Resposta

O sistema espera que o webhook responda com uma estrutura JSON que inclui ao menos os campos:

- `success`: boolean - indica se a operação foi bem-sucedida
- `message`: string - mensagem descritiva sobre o resultado

Para ações de criação/atualização, espera-se também um objeto com os dados da entidade criada/atualizada.

## Monitoramento

O sistema agora registra logs detalhados sobre as requisições e respostas do webhook, o que facilita a depuração em caso de problemas:

```
Recebida solicitação para proxy do webhook n8n: {
  method: 'POST',
  body: { /* dados da requisição */ }
}

Encaminhando para webhook externo

Resposta do webhook n8n: {
  status: 200,
  data: '{"success":true,"message":"Operação realizada com sucesso","user":{"id":"..."}}...'
}
```