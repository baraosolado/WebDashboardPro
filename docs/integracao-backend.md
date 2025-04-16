# Integração Backend FinTrack com Supabase e n8n

Este documento explica como modificar o backend do FinTrack para integrar com o Supabase usando o n8n como middleware.

## Visão Geral da Arquitetura

```
+-------------+        +------+        +-----------+
|   FinTrack  | -----> | n8n  | -----> | Supabase  |
| (Frontend)  |        |      |        | (Banco de |
+-------------+        +------+        |  Dados)   |
                                       +-----------+
```

## Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anonima

# n8n Webhook
WEBHOOK_URL=https://seu-n8n.exemplo.com/webhook/fintrack

# Database (usar conexão direta do PostgreSQL do Supabase se necessário)
DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

## Implementação no Backend

### 1. Modificação do Arquivo `routes.ts`

Atualize o arquivo `server/routes.ts` para enviar todos os eventos para o webhook do n8n:

```typescript
// Adicionar no topo do arquivo
import axios from 'axios';

// Função auxiliar para enviar eventos para o webhook
async function sendToWebhook(action: string, entityType: string, entityId: string | number, data: any) {
  try {
    // Usar a URL do webhook do n8n da variável de ambiente
    const webhookUrl = process.env.WEBHOOK_URL || 'https://webhook.dev.solandox.com/webhook/fintrack';
    
    await axios.post(webhookUrl, {
      action,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar para webhook:', error);
  }
}

// Exemplo de rota modificada para cadastro de usuário
apiRouter.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    console.log("Signup request:", { username, email });
    
    // Enviar para o webhook
    await sendToWebhook(
      'signup',
      'user',
      email,
      { email, username, password }
    );
    
    // Responder ao cliente
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
      success: true,
      user: { username, email }
    });
  } catch (error) {
    console.error("Erro no signup:", error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ message: "Internal server error" });
  }
});

// Exemplo de rota para criar transação
apiRouter.post("/transactions", async (req: Request, res: Response) => {
  try {
    // Validar dados da requisição
    const transactionData = insertTransactionSchema.parse(req.body);
    
    // Enviar para o webhook
    await sendToWebhook(
      'create',
      'transaction',
      'new',
      transactionData
    );
    
    // Responder ao cliente (pode ser atualizado para retornar os dados do Supabase se desejado)
    res.json({
      success: true,
      message: "Transação criada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Exemplo para atualização de orçamento
apiRouter.put("/budgets/:id", async (req: Request, res: Response) => {
  try {
    const budgetId = parseInt(req.params.id, 10);
    const budgetData = req.body;
    
    // Enviar para o webhook
    await sendToWebhook(
      'update',
      'budget',
      budgetId,
      { id: budgetId, ...budgetData }
    );
    
    res.json({
      success: true,
      message: "Orçamento atualizado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### 2. Conexão Direta com o Supabase (Opcional)

Se você precisar acessar o Supabase diretamente do backend, adicione o seguinte ao arquivo `server/db.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Verificar variáveis de ambiente
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY devem ser definidos nas variáveis de ambiente');
}

// Criar cliente do Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

### 3. Instalação das Dependências Necessárias

Execute o seguinte comando para instalar as dependências:

```bash
npm install axios @supabase/supabase-js
```

## Implementação do Storage com Supabase

Para implementar a classe `DatabaseStorage` usando o Supabase diretamente (caso não queira usar apenas o webhook do n8n):

```typescript
// server/storage.ts

import { supabase } from './db';
import { 
  users, User, InsertUser,
  categories, Category, InsertCategory,
  transactions, Transaction, InsertTransaction,
  budgets, Budget, InsertBudget,
  goals, Goal, InsertGoal,
  TransactionWithCategory, BudgetWithCategory,
  TransactionSummary, CategorySummary, MonthlyTrend
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Exemplo de implementação do método getUserByUsername
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error || !data) {
      return undefined;
    }
    
    return data as User;
  }
  
  // Exemplo de implementação do método createUser
  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();
      
    if (error || !data) {
      throw new Error(`Erro ao criar usuário: ${error?.message}`);
    }
    
    return data as User;
  }
  
  // Implementar outros métodos da interface IStorage...
}

export const storage = new DatabaseStorage();
```

## Lidando com Autenticação

Para autenticação, você pode usar o sistema de auth do Supabase:

```typescript
// Exemplo de login usando auth do Supabase
apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // 1. Enviar para o webhook
    await sendToWebhook(
      'login',
      'user',
      email,
      { email, password }
    );
    
    // 2. Fazer login direto no Supabase (opcional)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(200).json({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
```

## Considerações Adicionais

1. **Resiliência**: Implemente tentativas de reenvio e fila de mensagens para garantir que nenhum evento seja perdido se o webhook estiver temporariamente indisponível.

2. **Consistência**: Se estiver usando tanto o webhook quanto o acesso direto ao Supabase, certifique-se de que haja consistência entre as operações.

3. **Segurança**: Considere adicionar autenticação ao webhook para garantir que apenas o FinTrack possa enviar eventos.

4. **Monitoramento**: Adicione logs detalhados e monitoramento para diagnosticar problemas na integração.

## Implementação Híbrida

Uma abordagem híbrida pode ser ideal:

- Usar conexão direta para operações de leitura (melhora a latência)
- Usar webhook para operações de escrita (permite processamento assíncrono e integrações)

```typescript
// Exemplo de abordagem híbrida para transações
apiRouter.get("/transactions", async (_req: Request, res: Response) => {
  // Leitura direta do Supabase para melhor performance
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories(*)
    `);
    
  if (error) {
    return res.status(500).json({ message: error.message });
  }
  
  return res.json(data);
});

apiRouter.post("/transactions", async (req: Request, res: Response) => {
  // Escrita através do webhook para processamento assíncrono e integrações
  await sendToWebhook('create', 'transaction', 'new', req.body);
  return res.status(201).json({ success: true });
});
```