import { Budget, Expense, InsertBudget, InsertExpense, InsertUser, User } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getBudgets(userId: number): Promise<Budget[]>;
  createBudget(userId: number, budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;
  
  getExpenses(userId: number): Promise<Expense[]>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private budgets: Map<number, Budget>;
  private expenses: Map<number, Expense>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.budgets = new Map();
    this.expenses = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId,
    );
  }

  async createBudget(userId: number, budget: InsertBudget): Promise<Budget> {
    const id = this.currentId++;
    const newBudget: Budget = { ...budget, id, userId };
    this.budgets.set(id, newBudget);
    return newBudget;
  }

  async updateBudget(
    id: number,
    budget: Partial<InsertBudget>,
  ): Promise<Budget> {
    const existing = this.budgets.get(id);
    if (!existing) throw new Error("Budget not found");
    const updated = { ...existing, ...budget };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: number): Promise<void> {
    this.budgets.delete(id);
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId,
    );
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const id = this.currentId++;
    const newExpense: Expense = { ...expense, id, userId };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(
    id: number,
    expense: Partial<InsertExpense>,
  ): Promise<Expense> {
    const existing = this.expenses.get(id);
    if (!existing) throw new Error("Expense not found");
    const updated = { ...existing, ...expense };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }
}

export const storage = new MemStorage();
