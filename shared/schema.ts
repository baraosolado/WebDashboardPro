import { pgTable, text, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const categoryColorEnum = pgEnum('category_color', [
  'green', 'blue', 'purple', 'orange', 'pink', 'teal', 'red', 'yellow', 'indigo', 'gray'
]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: categoryColorEnum("color").notNull(),
  icon: text("icon"),
  type: transactionTypeEnum("type").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  type: transactionTypeEnum("type").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  notes: text("notes"),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  amount: real("amount").notNull(),
  period: text("period").notNull().default("monthly"),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  currentAmount: real("current_amount").notNull().default(0),
  targetDate: timestamp("target_date").notNull(),
  description: text("description"),
});

// Define relationships
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCategorySchema = createInsertSchema(categories)
  .pick({
    name: true,
    color: true,
    icon: true,
    type: true,
  });  // Não precisamos de coerção para categorias, todos são strings ou enums

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    description: true,
    amount: true,
    date: true,
    type: true,
    categoryId: true,
    notes: true,
  })
  .extend({
    amount: z.coerce.number().positive(),
    categoryId: z.coerce.number().int(),
    date: z.coerce.date(),
  });

export const insertBudgetSchema = createInsertSchema(budgets)
  .pick({
    categoryId: true,
    amount: true,
    period: true,
  })
  .extend({
    categoryId: z.coerce.number().int(),
    amount: z.coerce.number().positive(),
  });

export const insertGoalSchema = createInsertSchema(goals)
  .pick({
    name: true,
    targetAmount: true,
    currentAmount: true,
    targetDate: true,
    description: true,
  })
  .extend({
    targetAmount: z.coerce.number().positive(),
    currentAmount: z.coerce.number().min(0),
    targetDate: z.coerce.date(),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Extended types for frontend use
export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type BudgetWithCategory = Budget & {
  category: Category;
  spent: number;
};

export type TransactionSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type CategorySummary = {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage?: number;
};

export type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
};
