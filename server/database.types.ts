export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: number
          categoryId: number
          amount: number
          period: string
          createdAt: string
          userId: number | null
        }
        Insert: {
          id?: number
          categoryId: number
          amount: number
          period: string
          createdAt?: string
          userId?: number | null
        }
        Update: {
          id?: number
          categoryId?: number
          amount?: number
          period?: string
          createdAt?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_categoryId_fkey"
            columns: ["categoryId"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          type: "income" | "expense"
          color: string
          userId: number | null
        }
        Insert: {
          id?: number
          name: string
          type: "income" | "expense"
          color: string
          userId?: number | null
        }
        Update: {
          id?: number
          name?: string
          type?: "income" | "expense"
          color?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          id: number
          name: string
          targetAmount: number
          currentAmount: number
          targetDate: string
          createdAt: string
          userId: number | null
        }
        Insert: {
          id?: number
          name: string
          targetAmount: number
          currentAmount: number
          targetDate: string
          createdAt?: string
          userId?: number | null
        }
        Update: {
          id?: number
          name?: string
          targetAmount?: number
          currentAmount?: number
          targetDate?: string
          createdAt?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: number
          description: string
          amount: number
          date: string
          type: "income" | "expense"
          categoryId: number
          createdAt: string
          userId: number | null
        }
        Insert: {
          id?: number
          description: string
          amount: number
          date: string
          type: "income" | "expense"
          categoryId: number
          createdAt?: string
          userId?: number | null
        }
        Update: {
          id?: number
          description?: string
          amount?: number
          date?: string
          type?: "income" | "expense"
          categoryId?: number
          createdAt?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categoryId_fkey"
            columns: ["categoryId"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: number
          username: string
          password: string
          email: string | null
          createdAt: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          email?: string | null
          createdAt?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          email?: string | null
          createdAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}