import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  transactions, Transaction, InsertTransaction,
  budgets, Budget, InsertBudget,
  goals, Goal, InsertGoal,
  TransactionWithCategory, BudgetWithCategory,
  TransactionSummary, CategorySummary, MonthlyTrend
} from "@shared/schema";
import { supabase } from "./supabase";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(): Promise<TransactionWithCategory[]>;
  getRecentTransactions(limit: number): Promise<TransactionWithCategory[]>;
  getTransaction(id: number): Promise<TransactionWithCategory | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Budget methods
  getBudgets(): Promise<BudgetWithCategory[]>;
  getBudget(id: number): Promise<BudgetWithCategory | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Goal methods
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  addFundsToGoal(id: number, amount: number): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Summary methods
  getTransactionSummary(): Promise<TransactionSummary>;
  getCategorySummary(type: 'income' | 'expense'): Promise<CategorySummary[]>;
  getMonthlyTrends(months: number): Promise<MonthlyTrend[]>;
  
  // Seed data
  seedInitialData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private budgets: Map<number, Budget>;
  private goals: Map<number, Goal>;
  private currentId: { users: number; categories: number; transactions: number; budgets: number; goals: number };

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    this.currentId = { users: 1, categories: 1, transactions: 1, budgets: 1, goals: 1 };
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.type === type);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.currentId.categories++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithCategory[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(tx => {
        const category = this.categories.get(tx.categoryId);
        if (!category) throw new Error(`Category with id ${tx.categoryId} not found`);
        return { ...tx, category };
      });
  }

  async getRecentTransactions(limit: number): Promise<TransactionWithCategory[]> {
    return (await this.getTransactions()).slice(0, limit);
  }

  async getTransaction(id: number): Promise<TransactionWithCategory | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const category = this.categories.get(transaction.categoryId);
    if (!category) throw new Error(`Category with id ${transaction.categoryId} not found`);
    
    return { ...transaction, category };
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId.transactions++;
    const newTransaction: Transaction = { 
      ...transaction, 
      id, 
      date: transaction.date || new Date() 
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Budget methods
  async getBudgets(): Promise<BudgetWithCategory[]> {
    const result: BudgetWithCategory[] = [];
    
    for (const budget of this.budgets.values()) {
      const category = this.categories.get(budget.categoryId);
      if (!category) continue;
      
      // Calculate amount spent for this budget
      const spent = Array.from(this.transactions.values())
        .filter(tx => tx.categoryId === budget.categoryId && tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      result.push({ ...budget, category, spent });
    }
    
    return result;
  }

  async getBudget(id: number): Promise<BudgetWithCategory | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const category = this.categories.get(budget.categoryId);
    if (!category) throw new Error(`Category with id ${budget.categoryId} not found`);
    
    // Calculate amount spent for this budget
    const spent = Array.from(this.transactions.values())
      .filter(tx => tx.categoryId === budget.categoryId && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return { ...budget, category, spent };
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const id = this.currentId.budgets++;
    const newBudget: Budget = { ...budget, id };
    this.budgets.set(id, newBudget);
    return newBudget;
  }

  async updateBudget(id: number, budgetUpdate: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget: Budget = { ...budget, ...budgetUpdate };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }
  
  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .sort((a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime());
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.currentId.goals++;
    const newGoal: Goal = { 
      ...goal, 
      id,
      currentAmount: goal.currentAmount || 0,
      targetDate: goal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }
  
  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: Goal = { ...goal, ...goalUpdate };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async addFundsToGoal(id: number, amount: number): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: Goal = { 
      ...goal, 
      currentAmount: goal.currentAmount + amount
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Summary methods
  async getTransactionSummary(): Promise<TransactionSummary> {
    const income = Array.from(this.transactions.values())
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const expense = Array.from(this.transactions.values())
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }

  async getCategorySummary(type: 'income' | 'expense'): Promise<CategorySummary[]> {
    const transactions = Array.from(this.transactions.values()).filter(tx => tx.type === type);
    const categoryMap = new Map<number, number>();
    
    // Sum amounts by category
    transactions.forEach(tx => {
      const current = categoryMap.get(tx.categoryId) || 0;
      categoryMap.set(tx.categoryId, current + tx.amount);
    });
    
    // Convert to summary objects
    const result: CategorySummary[] = [];
    let total = 0;
    
    for (const [categoryId, amount] of categoryMap.entries()) {
      const category = this.categories.get(categoryId);
      if (!category) continue;
      
      result.push({
        categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        amount
      });
      
      total += amount;
    }
    
    // Calculate percentages
    if (total > 0) {
      result.forEach(item => {
        item.percentage = (item.amount / total) * 100;
      });
    }
    
    return result.sort((a, b) => b.amount - a.amount);
  }

  async getMonthlyTrends(months: number): Promise<MonthlyTrend[]> {
    const result: MonthlyTrend[] = [];
    const now = new Date();
    
    // Go back months-1 months to show trends including current month
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date(now);
      currentDate.setMonth(now.getMonth() - i);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Format month name
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(currentDate);
      
      // Filter transactions for this month
      const monthlyTransactions = Array.from(this.transactions.values()).filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === year && txDate.getMonth() === month;
      });
      
      const income = monthlyTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expense = monthlyTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      result.push({
        month: monthName,
        income,
        expense
      });
    }
    
    return result;
  }

  // Seed data for initial application state
  async seedInitialData(): Promise<void> {
    // Create categories
    const categories: InsertCategory[] = [
      { name: 'Alimentação', color: 'orange', icon: 'utensils', type: 'expense' },
      { name: 'Moradia', color: 'purple', icon: 'home', type: 'expense' },
      { name: 'Transporte', color: 'blue', icon: 'car', type: 'expense' },
      { name: 'Saúde', color: 'pink', icon: 'hospital', type: 'expense' },
      { name: 'Lazer', color: 'green', icon: 'film', type: 'expense' },
      { name: 'Educação', color: 'teal', icon: 'graduation-cap', type: 'expense' },
      { name: 'Salário', color: 'green', icon: 'money-bill', type: 'income' },
      { name: 'Investimentos', color: 'blue', icon: 'chart-line', type: 'income' }
    ];
    
    const createdCategories: Record<string, Category> = {};
    
    for (const category of categories) {
      const created = await this.createCategory(category);
      createdCategories[category.name] = created;
    }
    
    // Create budgets
    const budgets: InsertBudget[] = [
      { categoryId: createdCategories['Alimentação'].id, amount: 800, period: 'monthly' },
      { categoryId: createdCategories['Moradia'].id, amount: 1500, period: 'monthly' },
      { categoryId: createdCategories['Transporte'].id, amount: 200, period: 'monthly' },
      { categoryId: createdCategories['Saúde'].id, amount: 100, period: 'monthly' },
      { categoryId: createdCategories['Lazer'].id, amount: 150, period: 'monthly' }
    ];
    
    for (const budget of budgets) {
      await this.createBudget(budget);
    }
    
    // Create transactions
    const now = new Date();
    const transactions: InsertTransaction[] = [
      {
        description: 'Salário', 
        amount: 5000, 
        date: new Date(now.getFullYear(), now.getMonth(), 5), 
        type: 'income',
        categoryId: createdCategories['Salário'].id,
        notes: 'Salário mensal'
      },
      {
        description: 'Supermercado Extra', 
        amount: 250, 
        date: new Date(now.getFullYear(), now.getMonth(), 15), 
        type: 'expense',
        categoryId: createdCategories['Alimentação'].id,
        notes: 'Compras da semana'
      },
      {
        description: 'Aluguel', 
        amount: 1200, 
        date: new Date(now.getFullYear(), now.getMonth(), 14), 
        type: 'expense',
        categoryId: createdCategories['Moradia'].id,
        notes: 'Aluguel mensal'
      },
      {
        description: 'Uber', 
        amount: 35, 
        date: new Date(now.getFullYear(), now.getMonth(), 12), 
        type: 'expense',
        categoryId: createdCategories['Transporte'].id,
        notes: 'Ida ao trabalho'
      },
      {
        description: 'Farmácia São Paulo', 
        amount: 85, 
        date: new Date(now.getFullYear(), now.getMonth(), 10), 
        type: 'expense',
        categoryId: createdCategories['Saúde'].id,
        notes: 'Medicamentos'
      },
      {
        description: 'Cinema', 
        amount: 180, 
        date: new Date(now.getFullYear(), now.getMonth(), 8), 
        type: 'expense',
        categoryId: createdCategories['Lazer'].id,
        notes: 'Filme com amigos'
      }
    ];
    
    for (const tx of transactions) {
      await this.createTransaction(tx);
    }
    
    // Add historical data for charts
    for (let i = 1; i <= 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      
      // Income for previous months
      await this.createTransaction({
        description: 'Salário', 
        amount: 4800 + (i * 100), 
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5), 
        type: 'income',
        categoryId: createdCategories['Salário'].id,
        notes: 'Salário mensal'
      });
      
      // Expenses for previous months
      await this.createTransaction({
        description: 'Supermercado', 
        amount: 200 + (i * 10), 
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15), 
        type: 'expense',
        categoryId: createdCategories['Alimentação'].id,
        notes: 'Compras da semana'
      });
      
      await this.createTransaction({
        description: 'Aluguel', 
        amount: 1200, 
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10), 
        type: 'expense',
        categoryId: createdCategories['Moradia'].id,
        notes: 'Aluguel mensal'
      });
      
      await this.createTransaction({
        description: 'Transporte', 
        amount: 150 + (i * 5), 
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20), 
        type: 'expense',
        categoryId: createdCategories['Transporte'].id,
        notes: 'Transporte mensal'
      });
    }
    
    // Create sample goals
    const goals: InsertGoal[] = [
      {
        name: 'Viagem de férias',
        targetAmount: 5000,
        currentAmount: 2500,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 1),
        description: 'Economia para viagem de férias no final do ano'
      },
      {
        name: 'Comprar notebook novo',
        targetAmount: 4000,
        currentAmount: 1500,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 3, 15),
        description: 'Substituir notebook antigo'
      },
      {
        name: 'Fundo de emergência',
        targetAmount: 10000,
        currentAmount: 3000,
        targetDate: new Date(now.getFullYear() + 1, 0, 1),
        description: 'Reserva financeira para emergências'
      }
    ];
    
    for (const goal of goals) {
      await this.createGoal(goal);
    }
  }
}

// Database storage implementation
import { db } from "./db";
import { and, eq, desc, sql, count, sum } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.type, type));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryUpdate)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return result.rowCount > 0;
  }
  
  // Transaction methods
  async getTransactions(): Promise<TransactionWithCategory[]> {
    const result = await db
      .select({
        transaction: transactions,
        category: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.date));
    
    return result.map(r => ({
      ...r.transaction,
      category: r.category,
    }));
  }

  async getRecentTransactions(limit: number): Promise<TransactionWithCategory[]> {
    const result = await db
      .select({
        transaction: transactions,
        category: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.date))
      .limit(limit);
    
    return result.map(r => ({
      ...r.transaction,
      category: r.category,
    }));
  }

  async getTransaction(id: number): Promise<TransactionWithCategory | undefined> {
    const [result] = await db
      .select({
        transaction: transactions,
        category: categories,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.transaction,
      category: result.category,
    };
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transactionUpdate)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction || undefined;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return result.rowCount > 0;
  }
  
  // Budget methods
  async getBudgets(): Promise<BudgetWithCategory[]> {
    const budgetsWithCategory = await db
      .select({
        budget: budgets,
        category: categories,
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id));
    
    // Calculate spent amount for each budget
    const results: BudgetWithCategory[] = [];
    for (const item of budgetsWithCategory) {
      const [spentResult] = await db
        .select({
          spent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.categoryId, item.budget.categoryId),
            eq(transactions.type, 'expense')
          )
        );
      
      results.push({
        ...item.budget,
        category: item.category,
        spent: spentResult.spent,
      });
    }
    
    return results;
  }

  async getBudget(id: number): Promise<BudgetWithCategory | undefined> {
    const [budgetWithCategory] = await db
      .select({
        budget: budgets,
        category: categories,
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.id, id));
    
    if (!budgetWithCategory) return undefined;
    
    const [spentResult] = await db
      .select({
        spent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, budgetWithCategory.budget.categoryId),
          eq(transactions.type, 'expense')
        )
      );
    
    return {
      ...budgetWithCategory.budget,
      category: budgetWithCategory.category,
      spent: spentResult.spent,
    };
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values(budget)
      .returning();
    return newBudget;
  }

  async updateBudget(id: number, budgetUpdate: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budgetUpdate)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget || undefined;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await db
      .delete(budgets)
      .where(eq(budgets.id, id));
    return result.rowCount > 0;
  }
  
  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return db.select()
      .from(goals)
      .orderBy(desc(goals.targetDate));
  }
  
  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select()
      .from(goals)
      .where(eq(goals.id, id));
    return goal || undefined;
  }
  
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values({
        ...goal,
        currentAmount: goal.currentAmount || 0,
        description: goal.description || null
      })
      .returning();
    return newGoal;
  }
  
  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(goalUpdate)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal || undefined;
  }
  
  async addFundsToGoal(id: number, amount: number): Promise<Goal | undefined> {
    const [goal] = await db.select()
      .from(goals)
      .where(eq(goals.id, id));
    
    if (!goal) return undefined;
    
    const [updatedGoal] = await db
      .update(goals)
      .set({
        currentAmount: goal.currentAmount + amount
      })
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal || undefined;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(eq(goals.id, id));
    return result.rowCount > 0;
  }
  
  // Summary methods
  async getTransactionSummary(): Promise<TransactionSummary> {
    const [incomeSummary] = await db
      .select({
        income: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.type, 'income'));
    
    const [expenseSummary] = await db
      .select({
        expense: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.type, 'expense'));
    
    const income = incomeSummary.income || 0;
    const expense = expenseSummary.expense || 0;
    
    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  async getCategorySummary(type: 'income' | 'expense'): Promise<CategorySummary[]> {
    const summarByCategory = await db
      .select({
        categoryId: transactions.categoryId,
        amount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.as('amount'),
      })
      .from(transactions)
      .where(eq(transactions.type, type))
      .groupBy(transactions.categoryId);
    
    const total = summarByCategory.reduce((sum, item) => sum + item.amount, 0);
    
    // Get category details
    const result: CategorySummary[] = [];
    for (const item of summarByCategory) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, item.categoryId));
      
      if (category) {
        result.push({
          categoryId: item.categoryId,
          categoryName: category.name,
          categoryColor: category.color,
          amount: item.amount,
          percentage: total > 0 ? (item.amount / total) * 100 : 0,
        });
      }
    }
    
    return result.sort((a, b) => b.amount - a.amount);
  }

  async getMonthlyTrends(months: number): Promise<MonthlyTrend[]> {
    const now = new Date();
    const result: MonthlyTrend[] = [];
    
    // Go back months-1 months to show trends including current month
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date(now);
      currentDate.setMonth(now.getMonth() - i);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Format month name
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(currentDate);
      
      // Get income for this month
      const [incomeSummary] = await db
        .select({
          income: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            sql`${transactions.date} >= ${startOfMonth.toISOString()}`,
            sql`${transactions.date} <= ${endOfMonth.toISOString()}`
          )
        );
      
      // Get expense for this month
      const [expenseSummary] = await db
        .select({
          expense: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${startOfMonth.toISOString()}`,
            sql`${transactions.date} <= ${endOfMonth.toISOString()}`
          )
        );
      
      result.push({
        month: monthName,
        income: incomeSummary.income || 0,
        expense: expenseSummary.expense || 0,
      });
    }
    
    return result;
  }
  
  // Seed data
  async seedInitialData(): Promise<void> {
    // Check if data already exists
    const [categoryCount] = await db
      .select({ count: count() })
      .from(categories);
    
    if (categoryCount.count > 0) {
      console.log('Initial data already exists, skipping seed');
      return;
    }
    
    // Create categories
    const categoriesData: InsertCategory[] = [
      { name: 'Alimentação', color: 'orange', icon: 'utensils', type: 'expense' },
      { name: 'Moradia', color: 'purple', icon: 'home', type: 'expense' },
      { name: 'Transporte', color: 'blue', icon: 'car', type: 'expense' },
      { name: 'Saúde', color: 'pink', icon: 'hospital', type: 'expense' },
      { name: 'Lazer', color: 'green', icon: 'film', type: 'expense' },
      { name: 'Educação', color: 'teal', icon: 'graduation-cap', type: 'expense' },
      { name: 'Salário', color: 'green', icon: 'money-bill', type: 'income' },
      { name: 'Investimentos', color: 'blue', icon: 'chart-line', type: 'income' }
    ];
    
    const createdCategories = await db
      .insert(categories)
      .values(categoriesData)
      .returning();
    
    const categoryMap: Record<string, Category> = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat;
    });
    
    // Create budgets
    const budgetsData: InsertBudget[] = [
      { categoryId: categoryMap['Alimentação'].id, amount: 800, period: 'monthly' },
      { categoryId: categoryMap['Moradia'].id, amount: 1500, period: 'monthly' },
      { categoryId: categoryMap['Transporte'].id, amount: 200, period: 'monthly' },
      { categoryId: categoryMap['Saúde'].id, amount: 100, period: 'monthly' },
      { categoryId: categoryMap['Lazer'].id, amount: 150, period: 'monthly' }
    ];
    
    await db.insert(budgets).values(budgetsData);
    
    // Create transactions
    const now = new Date();
    const transactionsData: InsertTransaction[] = [
      {
        description: 'Salário', 
        amount: 5000, 
        date: new Date(now.getFullYear(), now.getMonth(), 5), 
        type: 'income',
        categoryId: categoryMap['Salário'].id,
        notes: 'Salário mensal'
      },
      {
        description: 'Supermercado Extra', 
        amount: 250, 
        date: new Date(now.getFullYear(), now.getMonth(), 15), 
        type: 'expense',
        categoryId: categoryMap['Alimentação'].id,
        notes: 'Compras da semana'
      },
      {
        description: 'Aluguel', 
        amount: 1200, 
        date: new Date(now.getFullYear(), now.getMonth(), 14), 
        type: 'expense',
        categoryId: categoryMap['Moradia'].id,
        notes: 'Aluguel mensal'
      },
      {
        description: 'Uber', 
        amount: 35, 
        date: new Date(now.getFullYear(), now.getMonth(), 12), 
        type: 'expense',
        categoryId: categoryMap['Transporte'].id,
        notes: 'Ida ao trabalho'
      },
      {
        description: 'Farmácia São Paulo', 
        amount: 85, 
        date: new Date(now.getFullYear(), now.getMonth(), 10), 
        type: 'expense',
        categoryId: categoryMap['Saúde'].id,
        notes: 'Medicamentos'
      },
      {
        description: 'Cinema', 
        amount: 180, 
        date: new Date(now.getFullYear(), now.getMonth(), 8), 
        type: 'expense',
        categoryId: categoryMap['Lazer'].id,
        notes: 'Filme com amigos'
      }
    ];
    
    await db.insert(transactions).values(transactionsData);
    
    // Add historical data for charts
    for (let i = 1; i <= 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      
      const historicalTransactions: InsertTransaction[] = [
        // Income for previous months
        {
          description: 'Salário', 
          amount: 4800 + (i * 100), 
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5), 
          type: 'income',
          categoryId: categoryMap['Salário'].id,
          notes: 'Salário mensal'
        },
        // Expenses for previous months
        {
          description: 'Supermercado', 
          amount: 200 + (i * 10), 
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15), 
          type: 'expense',
          categoryId: categoryMap['Alimentação'].id,
          notes: 'Compras da semana'
        },
        {
          description: 'Aluguel', 
          amount: 1200, 
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10), 
          type: 'expense',
          categoryId: categoryMap['Moradia'].id,
          notes: 'Aluguel mensal'
        },
        {
          description: 'Transporte', 
          amount: 150 + (i * 5), 
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20), 
          type: 'expense',
          categoryId: categoryMap['Transporte'].id,
          notes: 'Transporte mensal'
        }
      ];
      
      await db.insert(transactions).values(historicalTransactions);
    }
    
    // Create sample goals
    const goalsData: InsertGoal[] = [
      {
        name: 'Viagem de férias',
        targetAmount: 5000,
        currentAmount: 2500,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 6, 1),
        description: 'Economia para viagem de férias no final do ano'
      },
      {
        name: 'Comprar notebook novo',
        targetAmount: 4000,
        currentAmount: 1500,
        targetDate: new Date(now.getFullYear(), now.getMonth() + 3, 15),
        description: 'Substituir notebook antigo'
      },
      {
        name: 'Fundo de emergência',
        targetAmount: 10000,
        currentAmount: 3000,
        targetDate: new Date(now.getFullYear() + 1, 0, 1),
        description: 'Reserva financeira para emergências'
      }
    ];
    
    await db.insert(goals).values(goalsData);
  }
}

// Export a singleton instance of the storage
// Use DatabaseStorage instead of MemStorage
export class SupabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    // Usar sessionStore vazio por enquanto - será configurado no auth.ts
    this.sessionStore = null;
  }

  // Implementações que retornam arrays vazios ou valores iniciais para limpar a aplicação
  async getUser(id: number): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Para permitir login de teste com admin/123456
    if (username === 'admin' && process.env.NODE_ENV !== 'production') {
      return {
        id: 1,
        username: 'admin',
        password: '$2a$10$bHMoAK.2CQp9p2mLJrfVOeQ7zOI/iK3XFyqr5RFnlzCSUu1hUlhJy', // hash de '123456'
        email: 'admin@example.com',
        createdAt: '2023-01-01T00:00:00Z'
      };
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return {
      id: 1,
      ...insertUser,
      createdAt: new Date().toISOString()
    };
  }

  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar categorias:', error);
        return [];
      }
      
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon || null
      }));
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      return [];
    }
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', type);
      
      if (error) {
        console.error(`Erro ao buscar categorias do tipo ${type}:`, error);
        return [];
      }
      
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon || null
      }));
    } catch (err) {
      console.error(`Erro ao buscar categorias do tipo ${type}:`, err);
      return [];
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error(`Erro ao buscar categoria ${id}:`, error);
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        type: data.type as 'income' | 'expense',
        color: data.color,
        icon: data.icon || null
      };
    } catch (err) {
      console.error(`Erro ao buscar categoria ${id}:`, err);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      console.log('Criando categoria no Supabase:', category);
      
      // Extrair apenas os campos que existem na tabela
      const { name, type, color } = category;
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name, type, color }])
        .select()
        .single();
      
      if (error || !data) {
        console.error('Erro ao criar categoria:', error);
        throw new Error(`Erro ao criar categoria: ${error?.message}`);
      }
      
      console.log('Categoria criada com sucesso:', data);
      return {
        id: data.id,
        name: data.name,
        type: data.type as 'income' | 'expense',
        color: data.color
        // Campo icon removido pois não existe na tabela do Supabase
      };
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      throw err;
    }
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    return undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return true;
  }

  async getTransactions(): Promise<TransactionWithCategory[]> {
    // Requisitar dados reais do Supabase
    try {
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Erro ao buscar transações:", error);
        return [];
      }
      
      console.log("Transações do Supabase:", transactionsData);
      return transactionsData || [];
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      return [];
    }
  }

  async getRecentTransactions(limit: number): Promise<TransactionWithCategory[]> {
    // Requisitar dados recentes do Supabase
    try {
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Erro ao buscar transações recentes:", error);
        return [];
      }
      
      console.log("Transações recentes do Supabase:", transactionsData);
      return transactionsData || [];
    } catch (error) {
      console.error("Erro ao buscar transações recentes:", error);
      return [];
    }
  }

  async getTransaction(id: number): Promise<TransactionWithCategory | undefined> {
    return undefined;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      console.log('Criando transação no Supabase:', transaction);
      
      // Extrair apenas os campos que existem na tabela do Supabase
      const { description, amount, type, categoryId } = transaction;
      
      // Formatar a data corretamente
      const date = transaction.date instanceof Date ? 
        transaction.date.toISOString().split('T')[0] : 
        (transaction.date || new Date().toISOString().split('T')[0]);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          description,
          amount,
          date,
          type,
          category_id: categoryId
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao criar transação:', error);
        throw new Error(`Erro ao criar transação: ${error.message}`);
      }
      
      console.log('Transação criada com sucesso:', data);
      return {
        id: data.id,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type as 'income' | 'expense',
        categoryId: data.category_id
        // Removido campo notes pois não existe na tabela do Supabase
      };
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      console.log(`Atualizando transação ${id}:`, transactionUpdate);
      const updateData: any = {};
      
      if (transactionUpdate.description !== undefined) updateData.description = transactionUpdate.description;
      if (transactionUpdate.amount !== undefined) updateData.amount = transactionUpdate.amount;
      if (transactionUpdate.date !== undefined) updateData.date = transactionUpdate.date instanceof Date ? 
        transactionUpdate.date.toISOString().split('T')[0] : transactionUpdate.date;
      if (transactionUpdate.type !== undefined) updateData.type = transactionUpdate.type;
      if (transactionUpdate.categoryId !== undefined) updateData.category_id = transactionUpdate.categoryId;
      // Removido a atualização do campo notes pois não existe na tabela do Supabase
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Erro ao atualizar transação ${id}:`, error);
        return undefined;
      }
      
      console.log(`Transação ${id} atualizada com sucesso:`, data);
      return {
        id: data.id,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        type: data.type as 'income' | 'expense',
        categoryId: data.category_id
        // Removido campo notes pois não existe na tabela do Supabase
      };
    } catch (error) {
      console.error(`Erro ao atualizar transação ${id}:`, error);
      return undefined;
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Erro ao excluir transação ${id}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir transação ${id}:`, error);
      return false;
    }
  }

  async getBudgets(): Promise<BudgetWithCategory[]> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .order('id', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar orçamentos:', error);
        return [];
      }
      
      console.log('Orçamentos do Supabase:', data);
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return [];
    }
  }

  async getBudget(id: number): Promise<BudgetWithCategory | undefined> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Erro ao buscar orçamento ${id}:`, error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar orçamento ${id}:`, error);
      return undefined;
    }
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    try {
      console.log('Criando orçamento no Supabase:', budget);
      const { amount, categoryId, period } = budget;
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          amount,
          category_id: categoryId,
          period
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar orçamento:', error);
        throw new Error(`Erro ao criar orçamento: ${error.message}`);
      }
      
      console.log('Orçamento criado com sucesso:', data);
      return {
        id: data.id,
        amount: data.amount,
        categoryId: data.category_id,
        period: data.period,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      throw error;
    }
  }

  async updateBudget(id: number, budgetUpdate: Partial<InsertBudget>): Promise<Budget | undefined> {
    try {
      console.log(`Atualizando orçamento ${id}:`, budgetUpdate);
      const updateData: any = {};
      
      if (budgetUpdate.amount !== undefined) updateData.amount = budgetUpdate.amount;
      if (budgetUpdate.categoryId !== undefined) updateData.category_id = budgetUpdate.categoryId;
      if (budgetUpdate.period !== undefined) updateData.period = budgetUpdate.period;
      
      const { data, error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Erro ao atualizar orçamento ${id}:`, error);
        return undefined;
      }
      
      console.log(`Orçamento ${id} atualizado com sucesso:`, data);
      return {
        id: data.id,
        amount: data.amount,
        categoryId: data.category_id,
        period: data.period,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error(`Erro ao atualizar orçamento ${id}:`, error);
      return undefined;
    }
  }

  async deleteBudget(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir orçamento ${id}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir orçamento ${id}:`, error);
      return false;
    }
  }

  async getGoals(): Promise<Goal[]> {
    return [];
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return undefined;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    return {
      id: 1,
      ...goal,
      currentAmount: goal.currentAmount || 0,
      targetDate: goal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date().toISOString()
    };
  }

  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    return undefined;
  }

  async addFundsToGoal(id: number, amount: number): Promise<Goal | undefined> {
    return undefined;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return true;
  }

  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar transações para resumo:', error);
        return {
          income: 0,
          expense: 0,
          balance: 0
        };
      }
      
      const income = transactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const expense = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      return {
        income,
        expense,
        balance: income - expense
      };
    } catch (error) {
      console.error('Erro ao calcular resumo de transações:', error);
      return {
        income: 0,
        expense: 0,
        balance: 0
      };
    }
  }

  async getCategorySummary(type: 'income' | 'expense'): Promise<CategorySummary[]> {
    return [];
  }

  async getMonthlyTrends(months: number): Promise<MonthlyTrend[]> {
    const result: MonthlyTrend[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date(now);
      currentDate.setMonth(now.getMonth() - i);
      
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(currentDate);
      
      result.push({
        month: monthName,
        income: 0,
        expense: 0
      });
    }
    
    return result;
  }

  async seedInitialData(): Promise<void> {
    // Não precisamos semear dados iniciais
    return;
  }
}

export const storage = new SupabaseStorage();
