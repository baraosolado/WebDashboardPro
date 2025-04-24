# Correção da Configuração de Webhook no n8n

## Problema Identificado
O webhook `https://webhook.dev.solandox.com/webhook/fintrack` não está sendo chamado corretamente. Isso pode acontecer por duas razões:

1. O n8n está configurado para escutar em um URL diferente do que a aplicação está tentando acessar
2. A aplicação está tentando chamar o webhook externo, mas o n8n não está acessível na URL configurada

## Solução

### Opção 1: Ajustar a Configuração do n8n

Se você está executando o n8n localmente ou em um servidor:

1. Configure o n8n para escutar em uma URL que seja acessível externamente:
   ```
   n8n start --tunnel
   ```
   Isso criará um túnel público que pode ser acessado pela internet.

2. Atualize o webhook no n8n para usar o path `/webhook/fintrack`:
   - Vá para o nó "Webhook Principal" no workflow do n8n
   - Defina o caminho como `webhook/fintrack` (sem a barra inicial)
   - Verifique se o modo de resposta está definido como "Retornar resposta personalizada"

3. Obtenha a URL do webhook gerada pelo n8n e use-a em vez de `https://webhook.dev.solandox.com/webhook/fintrack` na aplicação.

### Opção 2: Configurar Proxy Reverso

Se você precisa usar especificamente a URL `https://webhook.dev.solandox.com/webhook/fintrack`:

1. Configure um proxy reverso (nginx, Apache, etc.) para encaminhar solicitações de `https://webhook.dev.solandox.com/webhook/fintrack` para onde seu n8n está escutando.

2. Exemplo de configuração Nginx:
   ```nginx
   server {
       listen 443 ssl;
       server_name webhook.dev.solandox.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location /webhook/fintrack {
           proxy_pass http://seu-n8n-server:5678/webhook/fintrack;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
   }
   ```

### Opção 3: Modificar o código para webhook temporário

Se você está apenas testando e não tem acesso a configurar um servidor externo, você pode modificar o código para usar um serviço de webhook temporário como webhook.site:

1. Crie um webhook temporário em [webhook.site](https://webhook.site)
2. Copie a URL fornecida
3. Modifique o seu código para enviar para essa URL temporária
4. Configure o n8n para verificar periodicamente esse webhook.site e processar os dados

### Opção 4: Modificar para usar seu próprio backend com n8n

A abordagem mais robusta seria:

1. Modificar o código para enviar solicitações para seu próprio backend (Express.js):
   ```javascript
   // No frontend
   const response = await fetch("/api/webhooks/n8n", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify(payload),
   });
   ```

2. No backend, criar um endpoint para receber e encaminhar para o n8n:
   ```javascript
   // No backend (Express)
   app.post("/api/webhooks/n8n", async (req, res) => {
     try {
       const response = await fetch("http://seu-n8n-server:5678/webhook/fintrack", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(req.body),
       });
       
       const data = await response.json();
       res.json(data);
     } catch (error) {
       console.error("Erro ao encaminhar para n8n:", error);
       res.status(500).json({ success: false, message: "Erro interno" });
     }
   });
   ```

## Solução Recomendada

Para seu ambiente específico, recomendamos a **Opção 4**, pois:

1. Não requer mudanças na URL do webhook no código do frontend
2. Mantém o n8n dentro da sua rede interna (mais seguro)
3. Fornece uma camada adicional para logs e tratamento de erros
4. É mais fácil de manter e depurar

### Configuração Recomendada

1. **No arquivo server/routes.ts**:
   ```typescript
   // Adicionar endpoint para webhook do n8n
   apiRouter.post("/webhooks/n8n", async (req: Request, res: Response) => {
     try {
       const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/fintrack";
       
       const response = await fetch(n8nWebhookUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(req.body),
       });
       
       const data = await response.json();
       res.json(data);
     } catch (error) {
       console.error("Erro ao encaminhar para n8n:", error);
       res.status(500).json({ success: false, message: "Erro interno" });
     }
   });
   ```

2. **No frontend**:
   ```typescript
   // Atualizar todas as chamadas de webhook para usar o endpoint do backend
   // De:
   await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {...});
   
   // Para:
   await fetch("/api/webhooks/n8n", {...});
   ```

3. **Configure a variável de ambiente**:
   ```
   N8N_WEBHOOK_URL=http://seu-n8n-server:5678/webhook/fintrack
   ```

4. **No n8n**:
   - Configure o nó de webhook para escutar em `/webhook/fintrack`
   - Certifique-se de que o n8n está acessível pelo seu servidor backend

Esta abordagem fornece a maior flexibilidade e segurança, permitindo que você mude a URL do n8n no futuro sem alterar o código do frontend.