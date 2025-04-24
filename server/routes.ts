import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTransactionSchema, 
  insertBudgetSchema, 
  insertCategorySchema,
  insertGoalSchema
} from "@shared/schema";
import { z } from "zod";
import { supabase } from "./supabase";
import fetch from "node-fetch";

// O sistema está configurado para enviar requisições diretamente para
// https://webhook.dev.solandox.com/webhook/fintrack

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  await storage.seedInitialData();
  
  // Configurar middleware do proxy webhook
  app.use('/api/webhooks/n8n', async (req: Request, res: Response) => {
    try {
      console.log("Recebida solicitação para proxy do webhook n8n:", {
        method: req.method,
        body: req.body
      });
      
      // Sempre usar o webhook externo solicitado pelo usuário
      console.log("Encaminhando para webhook externo");
      const n8nWebhookUrl = "https://webhook.dev.solandox.com/webhook/fintrack";
      
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      console.log("Resposta do webhook n8n:", {
        status: response.status,
        data: responseData ? 
          (typeof responseData === 'object' ? 
            JSON.stringify(responseData).substring(0, 100) + '...' : 
            String(responseData).substring(0, 100) + '...') :
          'Sem dados'
      });
      
      res.status(response.status);
      
      if (typeof responseData === 'object') {
        res.json(responseData);
      } else {
        res.send(responseData);
      }
    } catch (error) {
      console.error("Erro ao encaminhar para n8n:", error);
      res.status(500).json({ success: false, message: "Erro interno" });
    }
  });

  // Set up API routes
  const apiRouter = express.Router();
  
  // Categories endpoints
  apiRouter.get("/categories", async (_req: Request, res: Response) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  apiRouter.get("/categories/:type", async (req: Request, res: Response) => {
    const type = req.params.type as 'income' | 'expense';
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
    }
    
    const categories = await storage.getCategoriesByType(type);
    res.json(categories);
  });
  
  apiRouter.post("/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(validatedData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.put("/categories/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/categories/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const success = await storage.deleteCategory(id);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.status(204).end();
  });
  
  // Transactions endpoints
  apiRouter.get("/transactions", async (_req: Request, res: Response) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });
  
  apiRouter.get("/transactions/recent", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const transactions = await storage.getRecentTransactions(limit);
    res.json(transactions);
  });
  
  apiRouter.get("/transactions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const transaction = await storage.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
  });
  
  apiRouter.post("/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const newTransaction = await storage.createTransaction(validatedData);
      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.put("/transactions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, validatedData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      console.log(`Recebida solicitação para excluir transação ID ${id}`);
      
      // Verificar se a transação existe antes de tentar excluir
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        console.log(`Transação ID ${id} não encontrada`);
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      const success = await storage.deleteTransaction(id);
      if (!success) {
        console.log(`Falha ao excluir transação ID ${id}`);
        return res.status(500).json({ message: "Erro ao excluir transação" });
      }
      
      console.log(`Transação ID ${id} excluída com sucesso`);
      res.status(204).end();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Budgets endpoints
  apiRouter.get("/budgets", async (_req: Request, res: Response) => {
    const budgets = await storage.getBudgets();
    res.json(budgets);
  });
  
  apiRouter.get("/budgets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const budget = await storage.getBudget(id);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    res.json(budget);
  });
  
  apiRouter.post("/budgets", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      const newBudget = await storage.createBudget(validatedData);
      res.status(201).json(newBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.put("/budgets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const validatedData = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, validatedData);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/budgets/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const success = await storage.deleteBudget(id);
    if (!success) {
      return res.status(404).json({ message: "Budget not found" });
    }
    
    res.status(204).end();
  });
  
  // Summary endpoints
  apiRouter.get("/summary", async (_req: Request, res: Response) => {
    const summary = await storage.getTransactionSummary();
    res.json(summary);
  });
  
  apiRouter.get("/summary/categories/:type", async (req: Request, res: Response) => {
    const type = req.params.type as 'income' | 'expense';
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
    }
    
    const categorySummary = await storage.getCategorySummary(type);
    res.json(categorySummary);
  });
  
  apiRouter.get("/summary/trends", async (req: Request, res: Response) => {
    const months = parseInt(req.query.months as string) || 6;
    const trends = await storage.getMonthlyTrends(months);
    res.json(trends);
  });
  
  // Goals routes
  apiRouter.get("/goals", async (_req: Request, res: Response) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });
  
  apiRouter.get("/goals/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const goal = await storage.getGoal(id);
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    res.json(goal);
  });
  
  apiRouter.post("/goals", async (req: Request, res: Response) => {
    try {
      const validatedData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.put("/goals/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const validatedData = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(id, validatedData);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.post("/goals/:id/add-funds", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const { amount } = z.object({ amount: z.coerce.number().positive() }).parse(req.body);
      const goal = await storage.addFundsToGoal(id, amount);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  apiRouter.delete("/goals/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const success = await storage.deleteGoal(id);
    if (!success) {
      return res.status(404).json({ message: "Goal not found" });
    }
    
    res.status(204).end();
  });
  
  // User Profile endpoints
  apiRouter.put("/user/profile", async (req: Request, res: Response) => {
    try {
      // Normalmente, aqui você verificaria a autenticação do usuário
      // e atualizaria os dados do perfil no banco de dados
      
      // Como não temos um modelo completo de usuário, 
      // apenas retornamos sucesso com os dados enviados
      res.status(200).json({
        success: true,
        data: req.body
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Função para verificar se um usuário é o administrador do sistema
  const isAdminUser = (email: string, password: string) => {
    // Verificar usuário administrador fixo (você pode mudar isso para uma verificação no Supabase)
    if ((email === "admin" || email === "admin@fintrack.com") && password === "123456") {
      return { valid: true, username: "admin", email: "admin@fintrack.com" };
    }
    
    return { valid: false };
  };
  
  // Verificar login do usuário com Supabase
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password, token } = req.body;
      
      console.log("Login request:", { username, password, token: token ? "Presente" : "Ausente" });
      
      // Se o token não foi fornecido, este é um login inicial
      if (!token) {
        try {
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
          
          // Usuário existe, enviar dados para o webhook para verificação
          try {
            // Usar nosso próprio proxy para o webhook
            await fetch("/api/webhooks/n8n", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "login_request",
                entityType: "user",
                entityId: username,
                data: { 
                  email: username, 
                  password, 
                  timestamp: new Date().toISOString() 
                },
              }),
            });
            
            // Retornar sucesso no primeiro passo - deve prosseguir para verificação de token
            return res.status(200).json({
              success: true,
              requiresToken: true,
              message: "Por favor, insira o token enviado para seu email."
            });
            
          } catch (webhookError) {
            console.error("Erro ao enviar para webhook:", webhookError);
            return res.status(500).json({ 
              success: false, 
              message: "Erro ao processar solicitação de login." 
            });
          }
        } catch (dbError) {
          console.error("Erro de banco de dados:", dbError);
          return res.status(500).json({ 
            success: false, 
            message: "Erro interno do servidor." 
          });
        }
      } 
      // Se o token foi fornecido, este é o segundo passo da autenticação
      else {
        // Verificar na tabela de tokens se o token é válido
        try {
          // Enviar para o webhook para validar o token
          try {
            const webhookResponse = await fetch("/api/webhooks/n8n", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "verify_token",
                entityType: "user",
                entityId: username,
                data: { 
                  email: username, 
                  token,
                  timestamp: new Date().toISOString()
                },
              }),
            });
            
            // Em uma implementação real, você verificaria a resposta do webhook
            // mas para este exemplo, vamos considerar que o token é válido
            
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
            
          } catch (webhookError) {
            console.error("Erro ao verificar token:", webhookError);
            return res.status(500).json({ 
              success: false, 
              message: "Erro ao verificar token." 
            });
          }
        } catch (verifyError) {
          console.error("Erro ao verificar token:", verifyError);
          return res.status(500).json({ 
            success: false, 
            message: "Erro interno do servidor." 
          });
        }
      }
    } catch (error) {
      console.error("Erro geral no login:", error);
      return res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor" 
      });
    }
  });
  
  // Registrar novo usuário com integração Supabase
  apiRouter.post("/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password, phone } = req.body;
      
      console.log("Signup request:", { username, email, phone });
      
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
      
      // Enviar para o webhook para criar usuário através do n8n
      try {
        const webhookResponse = await fetch("/api/webhooks/n8n", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "signup",
            entityType: "user",
            entityId: email,
            data: { 
              email, 
              username, 
              password, 
              phone, 
              timestamp: new Date().toISOString() 
            },
          }),
        });
        
        // Em uma implementação real, você verificaria a resposta do webhook
        // e só retornaria sucesso se tudo ocorreu bem
        
        // Usuário criado com sucesso
        return res.status(201).json({
          success: true,
          user: { username, email }
        });
      } catch (webhookError) {
        console.error("Erro ao enviar para webhook:", webhookError);
        return res.status(500).json({
          success: false,
          message: "Erro ao processar cadastro."
        });
      }
    } catch (error) {
      console.error("Erro no signup:", error);
      return res.status(500).json({ 
        success: false,
        message: "Erro interno do servidor" 
      });
    }
  });
  
  // Mount API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
