import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getFinancialAdvice } from "./openai";
import { insertBudgetSchema, insertExpenseSchema } from "@shared/schema";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const budgets = await storage.getBudgets(req.user.id);
    res.json(budgets);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertBudgetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const budget = await storage.createBudget(req.user.id, parsed.data);
    res.status(201).json(budget);
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership before deletion
    const budgets = await storage.getBudgets(req.user.id);
    const budget = budgets.find(b => b.id === id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });
    if (budget.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    await storage.deleteBudget(id);
    res.sendStatus(200);
  });

  app.put("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
  
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  
    const { amount, category, period } = req.body;
    if (!amount || !category || !period) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    // Verify ownership before editing
    const budgets = await storage.getBudgets(req.user.id);
    const budget = budgets.find(b => b.id === id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });
    if (budget.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
  
    // Update the budget
    await storage.updateBudget(id, {
      amount,
      category,
      period
    });
  
    res.sendStatus(200);
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenses = await storage.getExpenses(req.user.id);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const expense = await storage.createExpense(req.user.id, parsed.data);
    res.status(201).json(expense);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    // Verify ownership before deletion
    const expenses = await storage.getExpenses(req.user.id);
    const expense = expenses.find(c => c.id === id);
    console.log(expense)
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    if (expense.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    await storage.deleteExpense(id);
    res.sendStatus(200);
  });

  app.put("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
  
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
  
    const { amount, category, description, date } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    // Verify ownership before editing
    const expenses = await storage.getExpenses(req.user.id);
    const expense = expenses.find(c => c.id === id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    if (expense.userId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
    // Update the expense
    await storage.updateExpense(id, {
      amount,
      category,
      description,
      date
    });
    res.sendStatus(200);
  });

  // AI Chatbot route
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    try {
      const expenses = await storage.getExpenses(req.user.id);
      const budgets = await storage.getBudgets(req.user.id);

      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

      const advice = await getFinancialAdvice(question, {
        expenses: totalExpenses,
        budget: totalBudget,
      });

      res.json({ response: advice });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}