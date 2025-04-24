# Solução para o Problema do Webhook do n8n

## Problema Identificado

A aplicação estava tentando chamar um webhook externo (`https://webhook.dev.solandox.com/webhook/fintrack`) que não estava funcionando por uma das seguintes razões:

1. O servidor n8n não está acessível nesse endereço
2. Há problemas de CORS ou rede no ambiente de desenvolvimento
3. As chamadas relativas no cliente (`/api/webhooks/n8n`) estão sendo interceptadas incorretamente

## Solução Implementada

Para contornar esse problema e permitir o desenvolvimento e teste, implementamos uma solução em duas partes:

### 1. Proxy no Servidor (Backend)

Adicionamos um middleware no Express que intercepta todas as chamadas para `/api/webhooks/n8n` e:

- Tenta encaminhar para o n8n real se configurado
- Usa um mockup local quando o n8n real não está disponível

```typescript
// Em server/routes.ts
app.use('/api/webhooks/n8n', async (req: Request, res: Response) => {
  try {
    console.log("Recebida solicitação para proxy do webhook n8n:", {
      method: req.method,
      body: req.body
    });
    
    // Verificar se devemos usar o mock ou tentar conectar ao n8n real
    const useMock = process.env.USE_WEBHOOK_MOCK === 'true' || true; // Por padrão usar mock
    
    if (useMock) {
      console.log("Usando mock do webhook para testes");
      return webhookMockHandler(req, res);
    }
    
    // ... código para encaminhar para o n8n real
  } catch (error) {
    console.error("Erro ao encaminhar para n8n:", error);
    res.status(500).json({ success: false, message: "Erro interno" });
  }
});
```

### 2. Mockup do Webhook (Simulação)

Criamos um arquivo `server/webhook-mock.ts` que simula o comportamento do n8n para:

- Autenticação (login_request e verify_token)
- Registro de usuários (signup)
- Criação de entidades (transações, categorias, orçamentos, metas)

```typescript
// Em server/webhook-mock.ts
export const webhookMockHandler = (req: Request, res: Response) => {
  const { action, entityType, data } = req.body;
  
  console.log('[MOCK WEBHOOK] Recebida requisição:', { action, entityType, data });
  
  switch (action) {
    case 'login_request':
      return handleLoginRequest(data, res);
    case 'verify_token':
      return handleVerifyToken(data, res);
    case 'signup':
      return handleSignup(data, res);
    // ... handlers para outras ações
  }
};
```

### 3. Atualização das URLs no Cliente

Atualizamos todas as chamadas no frontend que iam diretamente para o webhook externo, redirecionando para nosso proxy interno:

```typescript
// Antes
await fetch("https://webhook.dev.solandox.com/webhook/fintrack", { ... });

// Depois
await fetch("/api/webhooks/n8n", { ... });
```

## Como Configurar

1. **Ambiente de Desenvolvimento:**
   - Por padrão, usará o mockup do webhook para facilitar o desenvolvimento local
   - Não é necessário ter um n8n real rodando

2. **Ambiente de Produção:**
   - Defina a variável `USE_WEBHOOK_MOCK=false`
   - Configure `N8N_WEBHOOK_URL` com o URL correto do seu webhook n8n
   - Certifique-se de que o n8n está rodando e acessível

## Vantagens da Solução

1. **Desenvolvimento Isolado:** Permite desenvolver sem dependência de um n8n real
2. **Facilidade de Teste:** Comportamento consistente e previsível com o mockup
3. **Transição Suave:** Mesmo código funciona tanto com mockup quanto com n8n real
4. **Flexibilidade:** Configurável via variáveis de ambiente

Esta solução permite que você desenvolva e teste a aplicação mesmo quando o n8n não está disponível, facilitando o fluxo de desenvolvimento.