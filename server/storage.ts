import {
  users, User, InsertUser,
  categories, Category, InsertCategory,
  transactions, Transaction, InsertTransaction,
  budgets, Budget, InsertBudget,
  TransactionWithCategory, BudgetWithCategory,
  TransactionSummary, CategorySummary, MonthlyTrend
} from "@shared/schema";

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
  private currentId: { users: number; categories: number; transactions: number; budgets: number };

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.currentId = { users: 1, categories: 1, transactions: 1, budgets: 1 };
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
  }
}

// Export a singleton instance of the storage
export const storage = new MemStorage();
