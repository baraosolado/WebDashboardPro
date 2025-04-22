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
import downloadRouter from "./download";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  await storage.seedInitialData();

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
  
  // Armazenar usuários registrados em memória
  const registeredUsers: { email: string; username: string; password: string }[] = [];
  
  // Função para verificar credenciais
  const checkCredentials = (email: string, password: string) => {
    // Verificar usuário administrador fixo
    if ((email === "admin" || email === "admin@fintrack.com") && password === "123456") {
      return { valid: true, username: "admin", email: "admin@fintrack.com" };
    }
    
    // Verificar usuários registrados
    const user = registeredUsers.find(u => 
      (u.email === email || u.username === email) && u.password === password
    );
    
    if (user) {
      return { valid: true, username: user.username, email: user.email };
    }
    
    return { valid: false };
  };
  
  // Verificar login do usuário
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      console.log("Login request:", { username, password });
      
      // Verificar credenciais
      const result = checkCredentials(username, password);
      
      if (result.valid) {
        // Enviar para o webhook (como seria feito com Supabase e n8n)
        try {
          await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "login",
              entityType: "user",
              entityId: result.email,
              data: { 
                email: result.email, 
                username: result.username, 
                password, 
                timestamp: new Date().toISOString() 
              },
            }),
          });
        } catch (error) {
          console.error("Erro ao enviar para webhook:", error);
        }
        
        // Garantir que o Content-Type seja application/json
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          success: true,
          user: { username: result.username }
        });
      } else {
        // Garantir que o Content-Type seja application/json
        res.setHeader('Content-Type', 'application/json');
        res.status(401).json({
          success: false,
          message: "Credenciais inválidas"
        });
      }
    } catch (error) {
      console.error("Erro no login:", error);
      // Garantir que o Content-Type seja application/json
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Registrar novo usuário
  apiRouter.post("/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      console.log("Signup request:", { username, email });
      
      // Verificar se o usuário ou email já existe
      const userExists = registeredUsers.some(u => 
        u.email === email || u.username === username
      );
      
      if (userExists) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({
          success: false,
          message: "Usuário ou email já cadastrado"
        });
      }
      
      // Adicionar usuário à lista de registrados
      registeredUsers.push({ username, email, password });
      console.log("Usuário registrado:", { username, email });
      console.log("Total de usuários:", registeredUsers.length);
      
      // Enviar para o webhook (como seria feito com Supabase e n8n)
      try {
        await fetch("https://webhook.dev.solandox.com/webhook/fintrack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "signup",
            entityType: "user",
            entityId: email,
            data: { email, username, password, timestamp: new Date().toISOString() },
          }),
        });
      } catch (error) {
        console.error("Erro ao enviar para webhook:", error);
      }
      
      // Garantir que o Content-Type seja application/json
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({
        success: true,
        user: { username, email }
      });
    } catch (error) {
      console.error("Erro no signup:", error);
      // Garantir que o Content-Type seja application/json
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Mount API router
  app.use("/api", apiRouter);
  
  // Mount download router
  app.use(downloadRouter);

  const httpServer = createServer(app);
  return httpServer;
}
