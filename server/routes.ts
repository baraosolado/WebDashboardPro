import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTransactionSchema, 
  insertBudgetSchema, 
  insertCategorySchema 
} from "@shared/schema";
import { z } from "zod";

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
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    const success = await storage.deleteTransaction(id);
    if (!success) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.status(204).end();
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
  
  // Mount API router
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
